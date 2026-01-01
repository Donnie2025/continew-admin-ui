<template>
  <div class="gi_table_page">
    <GiTable
      title="课节管理"
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
	    <a-input-search v-model="queryForm.materialId" placeholder="请输入教材ID" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.materialName" placeholder="请输入教材名称" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.lessonName" placeholder="请输入课节名字" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:materialLesson:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:materialLesson:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:materialLesson:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:materialLesson:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:materialLesson:delete']"
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

    <MaterialLessonAddModal ref="MaterialLessonAddModalRef" @save-success="search" />
    <MaterialLessonDetailDrawer ref="MaterialLessonDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import MaterialLessonAddModal from './MaterialLessonAddModal.vue'
import MaterialLessonDetailDrawer from './MaterialLessonDetailDrawer.vue'
import { type MaterialLessonResp, type MaterialLessonQuery, deleteMaterialLesson, exportMaterialLesson, listMaterialLesson } from '@/apis/education/materialLesson'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'MaterialLesson' })


const queryForm = reactive<MaterialLessonQuery>({
  materialId: undefined,
  materialName: undefined,
  lessonName: undefined,
  status: undefined,
  createUser: undefined,
  createTime: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listMaterialLesson({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '教材ID', dataIndex: 'materialId', slotName: 'materialId' },
  { title: '教材名称', dataIndex: 'materialName', slotName: 'materialName' },
  { title: '课节名字', dataIndex: 'lessonName', slotName: 'lessonName' },
  { title: '课节链接', dataIndex: 'lessonUrl', slotName: 'lessonUrl' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:materialLesson:get', 'education:materialLesson:update', 'education:materialLesson:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.materialId = undefined
  queryForm.materialName = undefined
  queryForm.lessonName = undefined
  queryForm.status = undefined
  queryForm.createUser = undefined
  queryForm.createTime = undefined
  search()
}

// 删除
const onDelete = (record: MaterialLessonResp) => {
  return handleDelete(() => deleteMaterialLesson(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportMaterialLesson(queryForm))
}

const MaterialLessonAddModalRef = ref<InstanceType<typeof MaterialLessonAddModal>>()
// 新增
const onAdd = () => {
  MaterialLessonAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: MaterialLessonResp) => {
  MaterialLessonAddModalRef.value?.onUpdate(record.id)
}

const MaterialLessonDetailDrawerRef = ref<InstanceType<typeof MaterialLessonDetailDrawer>>()
// 详情
const onDetail = (record: MaterialLessonResp) => {
  MaterialLessonDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
