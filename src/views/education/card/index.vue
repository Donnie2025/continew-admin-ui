<template>
  <div class="gi_table_page">
    <GiTable
      title="会员卡管理管理"
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
	    <a-input-search v-model="queryForm.title" placeholder="请输入会员卡标题" allow-clear @search="search" />
        <a-select 
          v-model="queryForm.type" 
          placeholder="请选择会员卡类型" 
          allow-clear
          style="width: 200px"
          @change="search"
        >
          <a-option v-for="item in card_type" :key="item.value" :value="item.value">{{ item.label }}</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:card:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:card:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #type="{ record }">
        <GiCellTag :value="record.type" :dict="card_type" />
      </template>
      <template #status="{ record }">
        <GiCellTag :value="record.status" :dict="yes_no" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:card:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:card:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:card:delete']"
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

    <CardAddModal ref="CardAddModalRef" @save-success="search" />
    <CardDetailDrawer ref="CardDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import CardAddModal from './CardAddModal.vue'
import CardDetailDrawer from './CardDetailDrawer.vue'
import { type CardResp, type CardQuery, deleteCard, exportCard, listCard } from '@/apis/education/card'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Card' })

const { yes_no, card_type } = useDict('yes_no', 'card_type')

const queryForm = reactive<CardQuery>({
  title: undefined,
  type: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listCard({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: 'ID', dataIndex: 'id', slotName: 'id' },
  { title: '会员卡标题', dataIndex: 'title', slotName: 'title' },
  { title: '会员卡类型', dataIndex: 'type', slotName: 'type' },
  { title: '初始次数', dataIndex: 'initTimes', slotName: 'initTimes' },
  { title: '初始天数', dataIndex: 'initDays', slotName: 'initDays' },
  { title: '初始余额', dataIndex: 'initBalance', slotName: 'initBalance' },
  { title: '售卖价格', dataIndex: 'price', slotName: 'price' },
  { title: '排序', dataIndex: 'sort', slotName: 'sort' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:card:get', 'education:card:update', 'education:card:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.title = undefined
  queryForm.type = undefined
  search()
}

// 删除
const onDelete = (record: CardResp) => {
  return handleDelete(() => deleteCard(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportCard(queryForm))
}

const CardAddModalRef = ref<InstanceType<typeof CardAddModal>>()
// 新增
const onAdd = () => {
  CardAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: CardResp) => {
  CardAddModalRef.value?.onUpdate(record.id)
}

const CardDetailDrawerRef = ref<InstanceType<typeof CardDetailDrawer>>()
// 详情
const onDetail = (record: CardResp) => {
  CardDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
