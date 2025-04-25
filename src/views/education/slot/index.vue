<template>
  <div class="gi_table_page">
    <GiTable
      title="课程管理管理"
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
	    <a-input-search v-model="queryForm.teacherName" placeholder="请输入教师名字" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.startDate" placeholder="请输入开课日期（格式：YYYYMMDD）" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:slot:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:slot:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #isOnline="{ record }">
        <GiCellTag :value="record.isOnline" :dict="yes_no" />
      </template>
      <template #status="{ record }">
        <GiCellTag :value="record.status" :dict="status" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:slot:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:slot:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:slot:delete']"
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

    <SlotAddModal ref="SlotAddModalRef" @save-success="search" />
    <SlotDetailDrawer ref="SlotDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import SlotAddModal from './SlotAddModal.vue'
import SlotDetailDrawer from './SlotDetailDrawer.vue'
import { type SlotResp, type SlotQuery, deleteSlot, exportSlot, listSlot } from '@/apis/education/slot'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Slot' })

const { yes_no,status } = useDict('yes_no','status')

const queryForm = reactive<SlotQuery>({
  teacherName: undefined,
  startDate: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listSlot({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '所属教师ID', dataIndex: 'teacherId', slotName: 'teacherId' },
  { title: '教师名字', dataIndex: 'teacherName', slotName: 'teacherName' },
  { title: '开课日期（格式：YYYYMMDD）', dataIndex: 'startDate', slotName: 'startDate' },
  { title: '开课时间（格式：HH:MM）', dataIndex: 'startTime', slotName: 'startTime' },
  { title: '星期几（1：周一；2：周二；3：周三；4：周四；5：周五；6：周六；7：周日）', dataIndex: 'weekday', slotName: 'weekday' },
  { title: '课程时长（单位为分钟）', dataIndex: 'duration', slotName: 'duration' },
  { title: '是否在线教室（0：否；1：是）', dataIndex: 'isOnline', slotName: 'isOnline' },
  { title: '状态（1：启用；0：禁用）', dataIndex: 'status', slotName: 'status' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  { title: '所属机构ID', dataIndex: 'institutionId', slotName: 'institutionId' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:slot:get', 'education:slot:update', 'education:slot:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.teacherName = undefined
  queryForm.startDate = undefined
  search()
}

// 删除
const onDelete = (record: SlotResp) => {
  return handleDelete(() => deleteSlot(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportSlot(queryForm))
}

const SlotAddModalRef = ref<InstanceType<typeof SlotAddModal>>()
// 新增
const onAdd = () => {
  SlotAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: SlotResp) => {
  SlotAddModalRef.value?.onUpdate(record.id)
}

const SlotDetailDrawerRef = ref<InstanceType<typeof SlotDetailDrawer>>()
// 详情
const onDetail = (record: SlotResp) => {
  SlotDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
