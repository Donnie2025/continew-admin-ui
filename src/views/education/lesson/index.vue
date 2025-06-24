<template>
  <div class="gi_table_page">
    <GiTable
      title="课堂管理"
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
	    <a-input-search v-model="queryForm.courseId" placeholder="请输入课程ID" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.courseUid" placeholder="请输入ClassIn 课程ID" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.name" placeholder="请输入课堂活动名称" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.teacherUid" placeholder="请输入主讲教师UID" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.startTime" placeholder="请输入活动开始时间" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.endTime" placeholder="请输入活动结束时间" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:lesson:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:lesson:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #recordState="{ record }">
        <GiCellTag :value="record.recordState" :dict="yes_no" />
      </template>
      <template #liveState="{ record }">
        <GiCellTag :value="record.liveState" :dict="yes_no" />
      </template>
      <template #openState="{ record }">
        <GiCellTag :value="record.openState" :dict="yes_no" />
      </template>
      <template #status="{ record }">
        <GiCellTag :value="record.status" :dict="class_status" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:lesson:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:lesson:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:lesson:delete']"
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

    <LessonAddModal ref="LessonAddModalRef" @save-success="search" />
    <LessonDetailDrawer ref="LessonDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import LessonAddModal from './LessonAddModal.vue'
import LessonDetailDrawer from './LessonDetailDrawer.vue'
import { type LessonResp, type LessonQuery, deleteLesson, exportLesson, listLesson } from '@/apis/education/lesson'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Lesson' })

const { yes_no,class_status } = useDict('yes_no','class_status')

const queryForm = reactive<LessonQuery>({
  courseId: undefined,
  courseUid: undefined,
  name: undefined,
  teacherUid: undefined,
  startTime: undefined,
  endTime: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listLesson({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '主键ID', dataIndex: 'id', slotName: 'id' },
  { title: '课程ID', dataIndex: 'courseId', slotName: 'courseId' },
  { title: 'ClassIn 课程ID', dataIndex: 'courseUid', slotName: 'courseUid' },
  { title: 'ClassIn 活动ID', dataIndex: 'activityUid', slotName: 'activityUid' },
  { title: 'ClassIn 课堂ID', dataIndex: 'classUid', slotName: 'classUid' },
  { title: '单元ID', dataIndex: 'unitUid', slotName: 'unitUid' },
  { title: '课堂活动名称', dataIndex: 'name', slotName: 'name' },
  { title: '主讲教师UID', dataIndex: 'teacherUid', slotName: 'teacherUid' },
  { title: '活动开始时间', dataIndex: 'startTime', slotName: 'startTime' },
  { title: '活动结束时间', dataIndex: 'endTime', slotName: 'endTime' },
  { title: '上台人数', dataIndex: 'seatNum', slotName: 'seatNum' },
  { title: '录制状态', dataIndex: 'recordState', slotName: 'recordState' },
  { title: '直播状态', dataIndex: 'liveState', slotName: 'liveState' },
  { title: '公开状态', dataIndex: 'openState', slotName: 'openState' },
  { title: '状态', dataIndex: 'status', slotName: 'status' },
  { title: '创建者', dataIndex: 'createBy', slotName: 'createBy' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:lesson:get', 'education:lesson:update', 'education:lesson:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.courseId = undefined
  queryForm.courseUid = undefined
  queryForm.name = undefined
  queryForm.teacherUid = undefined
  queryForm.startTime = undefined
  queryForm.endTime = undefined
  search()
}

// 删除
const onDelete = (record: LessonResp) => {
  return handleDelete(() => deleteLesson(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportLesson(queryForm))
}

const LessonAddModalRef = ref<InstanceType<typeof LessonAddModal>>()
// 新增
const onAdd = () => {
  LessonAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: LessonResp) => {
  LessonAddModalRef.value?.onUpdate(record.id)
}

const LessonDetailDrawerRef = ref<InstanceType<typeof LessonDetailDrawer>>()
// 详情
const onDetail = (record: LessonResp) => {
  LessonDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
