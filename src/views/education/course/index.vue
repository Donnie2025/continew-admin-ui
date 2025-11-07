<template>
  <div class="gi_table_page">
    <GiTable
      title="班级管理"
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
	    <a-input-search v-model="queryForm.name" placeholder="请输入教室名称" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.mainTeacherId" placeholder="请输入班主任ID" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.institutionId" placeholder="请输入所属机构ID" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:course:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:course:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #mainTeacherName="{ record }">
        <span v-if="record.mainTeacherName">{{ record.mainTeacherName }}</span>
        <span v-else style="color: #999">未设置</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:course:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:course:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link title="关联老师" @click="onManageTeachers(record)">关联老师</a-link>
          <a-link title="关联学生" @click="onManageStudents(record)">关联学生</a-link>
          <a-link title="管理课节" @click="onManageLessons(record)">管理课节</a-link>
          <a-link
            v-permission="['education:course:delete']"
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

    <CourseAddModal ref="CourseAddModalRef" @save-success="search" />
    <CourseDetailDrawer ref="CourseDetailDrawerRef" />
    <CourseTeacherModal ref="CourseTeacherModalRef" @save-success="search" />
    <CourseStudentModal ref="CourseStudentModalRef" @save-success="search" />
    <CourseLessonModal ref="CourseLessonModalRef" @save-success="search" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import CourseAddModal from './CourseAddModal.vue'
import CourseDetailDrawer from './CourseDetailDrawer.vue'
import CourseTeacherModal from './CourseTeacherModal.vue'
import CourseStudentModal from './CourseStudentModal.vue'
import CourseLessonModal from './CourseLessonModal.vue'
import { type CourseResp, type CourseQuery, deleteCourse, exportCourse, listCourse } from '@/apis/education/course'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Course' })


const queryForm = reactive<CourseQuery>({
  name: undefined,
  mainTeacherId: undefined,
  institutionId: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listCourse({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '班级名称', dataIndex: 'name', slotName: 'name', width: 200 },
  { title: '班主任', dataIndex: 'mainTeacherName', slotName: 'mainTeacherName', width: 120 },
  { title: '所属机构', dataIndex: 'institutionName', slotName: 'institutionName', width: 150 },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 400,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:course:get', 'education:course:update', 'education:course:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.name = undefined
  queryForm.mainTeacherId = undefined
  queryForm.institutionId = undefined
  search()
}

// 删除
const onDelete = (record: CourseResp) => {
  return handleDelete(() => deleteCourse(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportCourse(queryForm))
}

const CourseAddModalRef = ref<InstanceType<typeof CourseAddModal>>()
// 新增
const onAdd = () => {
  CourseAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: CourseResp) => {
  CourseAddModalRef.value?.onUpdate(record.id)
}

const CourseDetailDrawerRef = ref<InstanceType<typeof CourseDetailDrawer>>()
// 详情
const onDetail = (record: CourseResp) => {
  CourseDetailDrawerRef.value?.onOpen(record.id)
}

const CourseTeacherModalRef = ref<InstanceType<typeof CourseTeacherModal>>()
// 管理老师
const onManageTeachers = (record: CourseResp) => {
  CourseTeacherModalRef.value?.onOpen(record.id, record.name)
}

const CourseStudentModalRef = ref<InstanceType<typeof CourseStudentModal>>()
// 管理学生
const onManageStudents = (record: CourseResp) => {
  CourseStudentModalRef.value?.onOpen(record.id, record.name)
}

const CourseLessonModalRef = ref<InstanceType<typeof CourseLessonModal>>()
// 管理课节
const onManageLessons = (record: CourseResp) => {
  CourseLessonModalRef.value?.onOpen(record.id, record.name)
}
</script>

<style scoped lang="scss"></style>
