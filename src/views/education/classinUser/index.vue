<template>
  <div class="gi_table_page">
    <GiTable
      title="Classin用户管理"
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
	    <a-input-search v-model="queryForm.nickname" placeholder="请输入昵称" allow-clear @search="search" />
        <a-select
          v-model="queryForm.userType"
          :options="user_type"
          placeholder="请选择成员类型（0：不是成员；1：学生；2：老师）"
          allow-clear
          style="width: 150px"
          @change="search"
        />
	    <a-input-search v-model="queryForm.telephone" placeholder="请输入手机号" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:classinUser:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:classinUser:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #userType="{ record }">
        <GiCellTag :value="record.userType" :dict="user_type" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:classinUser:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:classinUser:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:classinUser:delete']"
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

    <ClassinUserAddModal ref="ClassinUserAddModalRef" @save-success="search" />
    <ClassinUserDetailDrawer ref="ClassinUserDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import ClassinUserAddModal from './ClassinUserAddModal.vue'
import ClassinUserDetailDrawer from './ClassinUserDetailDrawer.vue'
import { type ClassinUserResp, type ClassinUserQuery, deleteClassinUser, exportClassinUser, listClassinUser } from '@/apis/education/classinUser'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'ClassinUser' })

const { user_type } = useDict('user_type')

const queryForm = reactive<ClassinUserQuery>({
  nickname: undefined,
  userType: undefined,
  telephone: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listClassinUser({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '昵称', dataIndex: 'nickname', slotName: 'nickname' },
  { title: '成员类型', dataIndex: 'userType', slotName: 'userType' },
  { title: 'Classin UID', dataIndex: 'uid', slotName: 'uid' },
  { title: '手机号', dataIndex: 'telephone', slotName: 'telephone' },
  { title: '关联学生ID', dataIndex: 'studentId', slotName: 'studentId' },
  { title: '关联教师ID', dataIndex: 'teacherId', slotName: 'teacherId' },
  { title: '创建时间', dataIndex: 'createTime', slotName: 'createTime' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:classinUser:get', 'education:classinUser:update', 'education:classinUser:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.nickname = undefined
  queryForm.userType = undefined
  queryForm.telephone = undefined
  search()
}

// 删除
const onDelete = (record: ClassinUserResp) => {
  return handleDelete(() => deleteClassinUser(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportClassinUser(queryForm))
}

const ClassinUserAddModalRef = ref<InstanceType<typeof ClassinUserAddModal>>()
// 新增
const onAdd = () => {
  ClassinUserAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: ClassinUserResp) => {
  ClassinUserAddModalRef.value?.onUpdate(record.id)
}

const ClassinUserDetailDrawerRef = ref<InstanceType<typeof ClassinUserDetailDrawer>>()
// 详情
const onDetail = (record: ClassinUserResp) => {
  ClassinUserDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
