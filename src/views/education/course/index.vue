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
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:course:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:course:update']" title="修改" @click="onUpdate(record)">修改</a-link>
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
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import CourseAddModal from './CourseAddModal.vue'
import CourseDetailDrawer from './CourseDetailDrawer.vue'
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
  { title: '教室名称', dataIndex: 'name', slotName: 'name' },
  { title: '班主任ID', dataIndex: 'mainTeacherId', slotName: 'mainTeacherId' },
  { title: 'Classin班主任ID', dataIndex: 'mainTeacherUid', slotName: 'mainTeacherUid' },
  { title: 'classin教室ID', dataIndex: 'courseUid', slotName: 'courseUid' },
  { title: '教室设置ID', dataIndex: 'courseSettingId', slotName: 'courseSettingId' },
  { title: '所属机构ID', dataIndex: 'institutionId', slotName: 'institutionId' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
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
</script>

<style scoped lang="scss"></style>
