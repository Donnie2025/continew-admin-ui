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
	    <a-input-search v-model="queryForm.createUser" placeholder="请输入创建人" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:booking:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:booking:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
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
  createUser: undefined,
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
  { title: '所属课程ID', dataIndex: 'slotId', slotName: 'slotId' },
  { title: '', dataIndex: 'startDate', slotName: 'startDate' },
  { title: '', dataIndex: 'startTime', slotName: 'startTime' },
  { title: '所属学生姓名', dataIndex: 'studentName', slotName: 'studentName' },
  { title: '预约手机号', dataIndex: 'phone', slotName: 'phone' },
  { title: '预约会员卡ID', dataIndex: 'cardId', slotName: 'cardId' },
  { title: '预约会员卡名称', dataIndex: 'cardName', slotName: 'cardName' },
  { title: '操作人名字', dataIndex: 'operatorName', slotName: 'operatorName' },
  { title: '操作时间', dataIndex: 'operateTime', slotName: 'operateTime' },
  { title: '预约教材名字', dataIndex: 'materialName', slotName: 'materialName' },
  { title: '预约备注', dataIndex: 'remark', slotName: 'remark' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  { title: '更新时间', dataIndex: 'updateTime', slotName: 'updateTime' },
  { title: '创建人', dataIndex: 'createUserString', slotName: 'createUser' },
  { title: '修改人', dataIndex: 'updateUserString', slotName: 'updateUser' },
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
  queryForm.createUser = undefined
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
// 新增
const onAdd = () => {
  BookingAddModalRef.value?.onAdd()
}

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
