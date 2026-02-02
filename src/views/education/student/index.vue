<template>
  <div class="gi_table_page">
    <GiTable
      title="学生管理管理"
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
	    <a-input-search v-model="queryForm.name" placeholder="请输入学生姓名" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.phone" placeholder="请输入手机号码" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:student:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:student:create']" @click="onBatchImport">
          <template #icon><icon-upload /></template>
          <template #default>批量导入</template>
        </a-button>
        <a-button v-permission="['education:student:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #avatar="{ record }">
        <a-image
          v-if="record.avatar"
          :src="record.avatar"
          :preview="true"
          width="40"
          height="40"
          fit="cover"
          style="border-radius: 50%; cursor: pointer;"
        >
          <template #loader>
            <a-spin />
          </template>
        </a-image>
        <a-avatar v-else :size="40">{{ record.name?.[0]?.toUpperCase() }}</a-avatar>
      </template>
      <template #name="{ record }">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span>{{ record.name }}</span>
          <a-button 
            v-permission="['education:student:update']"
            type="text" 
            size="mini" 
            title="修改姓名" 
            style="color: #1890ff; padding: 2px;"
            @click="onEditName(record)"
          >
            <template #icon>
              <icon-edit />
            </template>
          </a-button>
        </span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:student:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:student:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['education:student:update']" title="设置密码" @click="onSetPassword(record)">设置密码</a-link>
          <a-link
            v-permission="['education:student:delete']"
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

    <StudentAddModal ref="StudentAddModalRef" @save-success="search" />
    <StudentDetailDrawer ref="StudentDetailDrawerRef" />
    <StudentBatchImportModal ref="StudentBatchImportModalRef" @import-success="search" />
    <StudentSetPasswordModal ref="StudentSetPasswordModalRef" @save-success="search" />
    <StudentEditNameModal ref="StudentEditNameModalRef" @save-success="search" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import StudentAddModal from './StudentAddModal.vue'
import StudentDetailDrawer from './StudentDetailDrawer.vue'
import StudentBatchImportModal from './StudentBatchImportModal.vue'
import StudentSetPasswordModal from './StudentSetPasswordModal.vue'
import StudentEditNameModal from './StudentEditNameModal.vue'
import { type StudentResp, type StudentQuery, deleteStudent, exportStudent, listStudent } from '@/apis/education/student'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import { IconEye, IconEdit } from '@arco-design/web-vue/es/icon'

defineOptions({ name: 'Student' })

const { sex_type } = useDict('sex_type')

const queryForm = reactive<StudentQuery>({
  name: undefined,
  phone: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listStudent({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: 'ID', dataIndex: 'id', slotName: 'id' },
  { title: '学生姓名', dataIndex: 'name', slotName: 'name' },
  { title: '头像', dataIndex: 'avatar', slotName: 'avatar' },
  { title: '手机号码', dataIndex: 'phone', slotName: 'phone' },
  { title: '邮箱', dataIndex: 'email', slotName: 'email' },
  { title: '注册时间', dataIndex: 'registerTime', slotName: 'registerTime' },
  { title: '所属代理的ID', dataIndex: 'agentId', slotName: 'agentId' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 200,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:student:get', 'education:student:update', 'education:student:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.name = undefined
  queryForm.phone = undefined
  search()
}

// 删除
const onDelete = (record: StudentResp) => {
  return handleDelete(() => deleteStudent(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportStudent(queryForm))
}

const StudentAddModalRef = ref<InstanceType<typeof StudentAddModal>>()
// 新增
const onAdd = () => {
  StudentAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: StudentResp) => {
  StudentAddModalRef.value?.onUpdate(record.id)
}

const StudentDetailDrawerRef = ref<InstanceType<typeof StudentDetailDrawer>>()
// 详情
const onDetail = (record: StudentResp) => {
  StudentDetailDrawerRef.value?.onOpen(record.id)
}

const StudentBatchImportModalRef = ref<InstanceType<typeof StudentBatchImportModal>>()
// 批量导入
const onBatchImport = () => {
  StudentBatchImportModalRef.value?.onOpen()
}

const StudentSetPasswordModalRef = ref<InstanceType<typeof StudentSetPasswordModal>>()
// 设置密码
const onSetPassword = (record: StudentResp) => {
  StudentSetPasswordModalRef.value?.onOpen(record.id, record.name)
}

const StudentEditNameModalRef = ref<InstanceType<typeof StudentEditNameModal>>()
// 修改姓名
const onEditName = (record: StudentResp) => {
  StudentEditNameModalRef.value?.onOpen(record.id, record.name)
}
</script>

<style scoped lang="scss"></style>
