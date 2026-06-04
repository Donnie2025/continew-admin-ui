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
	    <a-select v-model="queryForm.agentCode" placeholder="请选择代理机构" allow-clear style="width: 180px" @change="search">
	      <a-option v-for="item in agentOptions" :key="item.code" :value="item.code">{{ item.name }}</a-option>
	    </a-select>
	    <a-input-search v-model="queryForm.mainTeacherId" placeholder="请输入班主任ID" allow-clear @search="search" />
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
      <template #teacherCount="{ record }">
        <template v-if="record.teacherCount && record.teacherCount > 0">
          <template v-if="record.teacherCount < 5">
            <div class="name-list">
              <span v-for="(teacher, index) in record.teachers" :key="teacher.teacherId" class="name-item">
                {{ teacher.teacherName }}<span v-if="index < record.teachers.length - 1">、</span>
              </span>
            </div>
          </template>
          <a-tooltip v-else position="right">
            <span class="count-cell count-cell-active">{{ record.teacherCount }}</span>
            <template #content>
              <div class="tooltip-content">
                <div class="tooltip-header">教师列表 ({{ record.teacherCount }})</div>
                <div v-for="teacher in record.teachers" :key="teacher.teacherId" class="tooltip-item">
                  <a-avatar :size="24" style="margin-right: 8px">
                    <icon-user />
                  </a-avatar>
                  <div class="tooltip-info">
                    <div class="tooltip-name">{{ teacher.teacherName }}</div>
                    <div class="tooltip-detail">{{ teacher.teacherPhone || teacher.teacherEmail || '-' }}</div>
                  </div>
                </div>
              </div>
            </template>
          </a-tooltip>
        </template>
        <span v-else class="count-cell">--</span>
      </template>
      <template #studentCount="{ record }">
        <template v-if="record.studentCount && record.studentCount > 0">
          <template v-if="record.studentCount < 7">
            <div class="name-list">
              <span v-for="(student, index) in record.students" :key="student.studentId" class="name-item">
                {{ student.studentName }}<span v-if="index < record.students.length - 1">、</span>
              </span>
            </div>
          </template>
          <a-tooltip v-else position="right">
            <span class="count-cell count-cell-active">{{ record.studentCount }}</span>
            <template #content>
              <div class="tooltip-content">
                <div class="tooltip-header">学生列表 ({{ record.studentCount }})</div>
                <div v-for="student in record.students" :key="student.studentId" class="tooltip-item">
                  <a-avatar :size="24" style="margin-right: 8px">
                    <icon-user />
                  </a-avatar>
                  <div class="tooltip-info">
                    <div class="tooltip-name">{{ student.studentName }}</div>
                    <div class="tooltip-detail">{{ student.studentPhone || student.studentEmail || '-' }}</div>
                  </div>
                </div>
              </div>
            </template>
          </a-tooltip>
        </template>
        <span v-else class="count-cell">--</span>
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
import { type CourseResp, type CourseQuery, deleteCourse, exportCourse, listCourse, listCourseTeachers, listCourseStudents } from '@/apis/education/course'
import { type AgentOption, listAgentOptions } from '@/apis/education/agent'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Course' })

const agentOptions = ref<AgentOption[]>([])

// 在组件挂载时调用search方法
onMounted(() => {
  listAgentOptions().then(res => { agentOptions.value = res.data || [] })
  search()
})


const queryForm = reactive<CourseQuery>({
  name: undefined,
  agentCode: undefined,
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
} = useTable((page) => listCourse({ ...queryForm, ...page }), { immediate: false })
const columns: TableInstance['columns'] = [
  { title: '班级名称', dataIndex: 'name', slotName: 'name', width: 200, align: 'center' },
  { title: '班主任', dataIndex: 'mainTeacherName', slotName: 'mainTeacherName', width: 80,align: 'center' },
  // { title: '所属机构', dataIndex: 'institutionName', slotName: 'institutionName', width: 80,align: 'center' },
  { title: '教师', dataIndex: 'teacherCount', slotName: 'teacherCount', width: 100 },
  { title: '班级学生', dataIndex: 'studentCount', slotName: 'studentCount', width: 180},
  { title: '备注', dataIndex: 'remark', slotName: 'remark', width: 100 ,ellipsis: true, tooltip: true},
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 300,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:course:get', 'education:course:update', 'education:course:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.name = undefined
  queryForm.agentCode = undefined
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

<style scoped lang="scss">
.count-cell {
  display: inline-block;
  min-width: 24px;
  padding: 0 4px;
  color: var(--color-text-3);
  font-weight: 500;
  cursor: default;
  transition: all 0.2s;

  &.count-cell-active {
    color: var(--color-text-1);
    cursor: pointer;
    background-color: var(--color-fill-2);
    border-radius: 12px;
    padding: 2px 8px;
    
    &:hover {
      color: var(--color-primary-6);
      background-color: var(--color-primary-light-1);
    }
  }
}

.tooltip-content {
  max-height: 300px;
  overflow-y: auto;
  padding: 4px;
  width: 240px;
  background-color: var(--color-bg-popup);
  border-radius: 6px;
}

.tooltip-header {
  font-weight: 600;
  font-size: 14px;
  padding: 8px 4px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--color-border-2);
  color: var(--color-text-1);
}

.tooltip-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  background-color: var(--color-fill-1);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-fill-2);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.tooltip-info {
  flex: 1;
  min-width: 0;
}

.tooltip-name {
  font-weight: 500;
  font-size: 14px;
  line-height: 1.2;
  margin-bottom: 2px;
  color: var(--color-text-1);
}

.tooltip-detail {
  font-size: 12px;
  color: var(--color-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  color: var(--color-text-2);
  font-size: 14px;
  line-height: 1.5;
}

.name-item {
  white-space: nowrap;
}
</style>
