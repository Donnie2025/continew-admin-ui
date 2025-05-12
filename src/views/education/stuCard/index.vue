<template>
  <div class="gi_table_page">
    <GiTable
      title="会员绑卡管理"
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
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:stuCard:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:stuCard:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #cardType="{ record }">
        <GiCellTag :value="record.cardType" :dict="card_type" />
      </template>
      <template #cardStatus="{ record }">
        <GiCellTag :value="record.cardStatus" :dict="yes_no" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:stuCard:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:stuCard:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:stuCard:delete']"
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

    <StuCardAddModal ref="StuCardAddModalRef" @save-success="search" />
    <StuCardDetailDrawer ref="StuCardDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import StuCardAddModal from './StuCardAddModal.vue'
import StuCardDetailDrawer from './StuCardDetailDrawer.vue'
import { type StuCardResp, type StuCardQuery, deleteStuCard, exportStuCard, listStuCard } from '@/apis/education/stuCard'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'StuCard' })

const { yes_no,card_type } = useDict('yes_no','card_type')

const queryForm = reactive<StuCardQuery>({
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listStuCard({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: 'ID', dataIndex: 'id', slotName: 'id' },
  { title: '学生ID', dataIndex: 'stuId', slotName: 'stuId' },
  { title: '学生姓名', dataIndex: 'stuName', slotName: 'stuName' },
  { title: '会员卡ID', dataIndex: 'cardId', slotName: 'cardId' },
  { title: '会员卡名称', dataIndex: 'cardName', slotName: 'cardName' },
  { title: '会员卡类型（1：次卡有限期；2：次卡无限期；3：储蓄卡有限期；4：储蓄卡无限期）', dataIndex: 'cardType', slotName: 'cardType' },
  { title: '剩余次数/余额', dataIndex: 'balance', slotName: 'balance' },
  { title: '到期日期', dataIndex: 'expireDate', slotName: 'expireDate' },
  { title: '卡状态（1：启用，学生端可见；0：禁用，学生端不可见，后台管理系统可见）', dataIndex: 'cardStatus', slotName: 'cardStatus' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:stuCard:get', 'education:stuCard:update', 'education:stuCard:delete'])
  }
]

// 重置
const reset = () => {
  search()
}

// 删除
const onDelete = (record: StuCardResp) => {
  return handleDelete(() => deleteStuCard(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportStuCard(queryForm))
}

const StuCardAddModalRef = ref<InstanceType<typeof StuCardAddModal>>()
// 新增
const onAdd = () => {
  StuCardAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: StuCardResp) => {
  StuCardAddModalRef.value?.onUpdate(record.id)
}

const StuCardDetailDrawerRef = ref<InstanceType<typeof StuCardDetailDrawer>>()
// 详情
const onDetail = (record: StuCardResp) => {
  StuCardDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
