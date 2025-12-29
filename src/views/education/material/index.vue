<template>
  <div class="gi_table_page">
    <GiTable
      title="教材管理"
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
	    <a-input-search v-model="queryForm.code" placeholder="请输入教材编码" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.name" placeholder="请输入教材名字" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.level" placeholder="请输入级别" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.category" placeholder="请输入分类" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.isShow" placeholder="请输入是否前端展示（1:展示 0:不展示）" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.sort" placeholder="请输入排序" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.status" placeholder="请输入状态（1:启用 0:禁用）" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.createUser" placeholder="请输入创建人" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.createTime" placeholder="请输入创建时间" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:material:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:material:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:material:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:material:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:material:delete']"
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

    <MaterialAddModal ref="MaterialAddModalRef" @save-success="search" />
    <MaterialDetailDrawer ref="MaterialDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import MaterialAddModal from './MaterialAddModal.vue'
import MaterialDetailDrawer from './MaterialDetailDrawer.vue'
import { type MaterialResp, type MaterialQuery, deleteMaterial, exportMaterial, listMaterial } from '@/apis/education/material'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Material' })


const queryForm = reactive<MaterialQuery>({
  code: undefined,
  name: undefined,
  level: undefined,
  category: undefined,
  isShow: undefined,
  sort: undefined,
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
} = useTable((page) => listMaterial({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '主键ID', dataIndex: 'id', slotName: 'id' },
  { title: '教材编码', dataIndex: 'code', slotName: 'code' },
  { title: '教材名字', dataIndex: 'name', slotName: 'name' },
  { title: '级别（K1:幼儿园小班 K2:幼儿园中班 K3:幼儿园大班 G1-G12:1-12年级 ADULT:成人）', dataIndex: 'level', slotName: 'level' },
  { title: '分类（CHILDREN:少儿启蒙 TEENAGER:青少年 ADULT:成人教材 COMPREHENSIVE:综合教材 READING:阅读绘本 PHONICS:自然拼读 EXAM:考试教材 GRAMMAR:语法）', dataIndex: 'category', slotName: 'category' },
  { title: '封面图片', dataIndex: 'coverImg', slotName: 'coverImg' },
  { title: '教材描述', dataIndex: 'desc', slotName: 'desc' },
  { title: '是否前端展示（1:展示 0:不展示）', dataIndex: 'isShow', slotName: 'isShow' },
  { title: '排序', dataIndex: 'sort', slotName: 'sort' },
  { title: '状态（1:启用 0:禁用）', dataIndex: 'status', slotName: 'status' },
  { title: '创建人', dataIndex: 'createUserString', slotName: 'createUser' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  { title: '修改人', dataIndex: 'updateUserString', slotName: 'updateUser' },
  { title: '修改时间', dataIndex: 'updateTime', slotName: 'updateTime' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:material:get', 'education:material:update', 'education:material:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.code = undefined
  queryForm.name = undefined
  queryForm.level = undefined
  queryForm.category = undefined
  queryForm.isShow = undefined
  queryForm.sort = undefined
  queryForm.status = undefined
  queryForm.createUser = undefined
  queryForm.createTime = undefined
  search()
}

// 删除
const onDelete = (record: MaterialResp) => {
  return handleDelete(() => deleteMaterial(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportMaterial(queryForm))
}

const MaterialAddModalRef = ref<InstanceType<typeof MaterialAddModal>>()
// 新增
const onAdd = () => {
  MaterialAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: MaterialResp) => {
  MaterialAddModalRef.value?.onUpdate(record.id)
}

const MaterialDetailDrawerRef = ref<InstanceType<typeof MaterialDetailDrawer>>()
// 详情
const onDetail = (record: MaterialResp) => {
  MaterialDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
