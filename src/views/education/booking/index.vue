<template>
  <div class="gi_table_page">
    <GiTable
      title="预约管理"
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
	    <a-input-search v-model="queryForm.studentName" placeholder="请输入所属学生姓名" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.cardName" placeholder="请输入预约会员卡名称" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:booking:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #courseDateTime="{ record }">
        <span v-if="record.slotDate">{{ record.slotDate.slice(0,4) }}-{{ record.slotDate.slice(4,6) }}-{{ record.slotDate.slice(6,8) }} {{ record.slotTime }}</span>
      </template>
      <template #materialName="{ record }">
        <span v-if="record.materialName">{{ record.materialName }}{{ record.materialLevel ? ' - ' + record.materialLevel : '' }}</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:booking:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:booking:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:booking:delete']"
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

    <BookingAddModal ref="BookingAddModalRef" @save-success="search" />
    <BookingDetailDrawer ref="BookingDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import BookingAddModal from './BookingAddModal.vue'
import BookingDetailDrawer from './BookingDetailDrawer.vue'
import { type BookingResp, type BookingQuery, deleteBooking, exportBooking, listBooking } from '@/apis/education/booking'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Booking' })


const queryForm = reactive<BookingQuery>({
  studentName: undefined,
  cardName: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listBooking({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '姓名', dataIndex: 'studentName', slotName: 'studentName' },  
  { title: '时间', dataIndex: 'slotDate', slotName: 'courseDateTime' },
  { title: '手机号', dataIndex: 'studentPhone', slotName: 'studentPhone' },
  { title: '会员卡', dataIndex: 'cardName', slotName: 'cardName' },
  { title: '预约教材', dataIndex: 'materialName', slotName: 'materialName' },
  { title: '课节', dataIndex: 'lessonName', slotName: 'lessonName' },
  { title: '预约备注', dataIndex: 'remark', slotName: 'remark' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:booking:get', 'education:booking:update', 'education:booking:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.studentName = undefined
  queryForm.cardName = undefined
  search()
}

// 删除
const onDelete = (record: BookingResp) => {
  return handleDelete(() => deleteBooking(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportBooking(queryForm))
}

const BookingAddModalRef = ref<InstanceType<typeof BookingAddModal>>()
// 修改
const onUpdate = (record: BookingResp) => {
  BookingAddModalRef.value?.onUpdate(record.id)
}

const BookingDetailDrawerRef = ref<InstanceType<typeof BookingDetailDrawer>>()
// 详情
const onDetail = (record: BookingResp) => {
  BookingDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
