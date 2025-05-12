<template>
  <div class="gi_table_page">
    <GiTable
      title="订单管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
	    <a-input-search v-model="queryForm.stuId" placeholder="请输入学生ID" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.cardId" placeholder="请输入会员卡ID" allow-clear @search="search" />
        <a-select
          v-model="queryForm.type"
          :options="transaction_type"
          placeholder="请选择变动类型"
          allow-clear
          style="width: 150px"
          @change="search"
        />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:transaction:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:transaction:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #type="{ record }">
        <GiCellTag :value="record.type" :dict="transaction_type" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:transaction:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:transaction:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:transaction:delete']"
            status="danger"
            :disabled="record.disabled"
            :title="record.disabled ? '不可删除' : '删除'"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <TransactionAddModal ref="TransactionAddModalRef" @save-success="search" />
    <TransactionDetailDrawer ref="TransactionDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import TransactionAddModal from './TransactionAddModal.vue'
import TransactionDetailDrawer from './TransactionDetailDrawer.vue'
import { type TransactionResp, type TransactionQuery, deleteTransaction, exportTransaction, listTransaction } from '@/apis/education/transaction'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Transaction' })

const { transaction_type } = useDict('transaction_type')

const queryForm = reactive<TransactionQuery>({
  stuId: undefined,
  cardId: undefined,
  type: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listTransaction({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: 'ID', dataIndex: 'id', slotName: 'id' },
  { title: '学生会员卡绑定表ID', dataIndex: 'stuCardId', slotName: 'stuCardId' },
  { title: '学生ID', dataIndex: 'stuId', slotName: 'stuId' },
  { title: '学生姓名', dataIndex: 'stuName', slotName: 'stuName' },
  { title: '会员卡ID', dataIndex: 'cardId', slotName: 'cardId' },
  { title: '会员卡名称', dataIndex: 'cardName', slotName: 'cardName' },
  { title: '变动类型', dataIndex: 'type', slotName: 'type' },
  { title: '支出金额（扣款）', dataIndex: 'debitAmount', slotName: 'debitAmount' },
  { title: '收入金额（充值/收入）', dataIndex: 'creditAmount', slotName: 'creditAmount' },
  { title: '减少有效期天数', dataIndex: 'debitDays', slotName: 'debitDays' },
  { title: '增加有效期天数', dataIndex: 'creditDays', slotName: 'creditDays' },
  { title: '变动前余额/次数', dataIndex: 'beforeAmount', slotName: 'beforeAmount' },
  { title: '变动后余额/次数', dataIndex: 'afterAmount', slotName: 'afterAmount' },
  { title: '实收金额', dataIndex: 'actualAmount', slotName: 'actualAmount' },
  { title: '备注', dataIndex: 'remark', slotName: 'remark' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  { title: '操作人姓名', dataIndex: 'operatorName', slotName: 'operatorName' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:transaction:get', 'education:transaction:update', 'education:transaction:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.stuId = undefined
  queryForm.cardId = undefined
  queryForm.type = undefined
  search()
}

// 删除
const onDelete = (record: TransactionResp) => {
  return handleDelete(() => deleteTransaction(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportTransaction(queryForm))
}

const TransactionAddModalRef = ref<InstanceType<typeof TransactionAddModal>>()
// 新增
const onAdd = () => {
  TransactionAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: TransactionResp) => {
  TransactionAddModalRef.value?.onUpdate(record.id)
}

const TransactionDetailDrawerRef = ref<InstanceType<typeof TransactionDetailDrawer>>()
// 详情
const onDetail = (record: TransactionResp) => {
  TransactionDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
