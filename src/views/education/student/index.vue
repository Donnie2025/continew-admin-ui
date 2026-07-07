<template>
  <div class="gi_table_page">
    <GiTable
      title="学生管理"
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
        <a-select
          v-model="queryForm.agentCode"
          placeholder="请选择代理商"
          allow-clear
          allow-search
          style="width: 180px"
          @change="search"
        >
          <a-option v-for="opt in agentOptions" :key="opt.code" :value="opt.code">{{ opt.name }}</a-option>
        </a-select>
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
      <template #activeCards="{ record }">
        <span v-if="!record.activeCards || record.activeCards.length === 0" style="color: var(--color-text-3)">-</span>
        <a-space v-else wrap :size="4">
          <span v-for="(card, idx) in record.activeCards" :key="idx">
            {{ ['TL','TU'].includes(card.cardType) ? card.balance + '次' : card.balance }}
          </span>
        </a-space>
      </template>
      <template #enableRecording="{ record }">
        <a-tag v-if="record.enableRecording === 1" color="green">允许录课</a-tag>
        <a-tag v-else color="gray">不允许录课</a-tag>
      </template>
      <template #paidBalance="{ record }">
        <span :style="{
          color: record.paidBalance > 0 ? 'rgb(var(--success-6))' : 'var(--color-text-3)',
          fontWeight: record.paidBalance > 0 ? 600 : 400,
          fontSize: record.paidBalance > 0 ? '15px' : '14px'
        }">
          {{ (record.paidBalance || 0).toFixed(0) }}
        </span>
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
          <a-link v-permission="['education:student:get']" @click="onDetail(record)">查看</a-link>
          <a-dropdown trigger="hover">
            <a-link>
              更多
              <icon-down />
            </a-link>
            <template #content>
              <a-doption v-permission="['education:student:update']" @click="onUpdate(record)">
                <icon-edit />
                修改
              </a-doption>
              <a-doption v-permission="['education:student:update']" @click="onSetPassword(record)">
                <icon-lock />
                设置密码
              </a-doption>
              <a-doption
                v-permission="['education:student:delete']"
                :disabled="record.disabled"
                @click="onDelete(record)"
              >
                <icon-delete />
                <span :style="{ color: record.disabled ? '' : 'rgb(var(--danger-6))' }">删除</span>
              </a-doption>
            </template>
          </a-dropdown>
        </a-space>
      </template>
    </GiTable>

    <StudentAddModal ref="StudentAddModalRef" @save-success="search" />
    <StudentDetailDrawer ref="StudentDetailDrawerRef" />
    <StudentBatchImportModal ref="StudentBatchImportModalRef" @import-success="search" />
    <StudentSetPasswordModal ref="StudentSetPasswordModalRef" @save-success="search" />
    <StudentEditNameModal ref="StudentEditNameModalRef" @save-success="search" />
    <StudentAdjustBalanceModal ref="StudentAdjustBalanceModalRef" @save-success="search" />
    <StudentBalanceRecordsDrawer ref="StudentBalanceRecordsDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import StudentAddModal from './StudentAddModal.vue'
import StudentDetailDrawer from './StudentDetailDrawer.vue'
import StudentBatchImportModal from './StudentBatchImportModal.vue'
import StudentSetPasswordModal from './StudentSetPasswordModal.vue'
import StudentEditNameModal from './StudentEditNameModal.vue'
import StudentAdjustBalanceModal from './StudentAdjustBalanceModal.vue'
import StudentBalanceRecordsDrawer from './StudentBalanceRecordsDrawer.vue'
import { type StudentResp, type StudentQuery, deleteStudent, exportStudent, listStudent } from '@/apis/education/student'
import { type AgentOption, listAgentOptions } from '@/apis/education/agent'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import { IconDown, IconEye, IconEdit, IconHistory, IconLock, IconDelete } from '@arco-design/web-vue/es/icon'

defineOptions({ name: 'Student' })

const { sex_type } = useDict('sex_type')
const agentOptions = ref<AgentOption[]>([])
listAgentOptions().then(res => { agentOptions.value = res.data })

const queryForm = reactive<StudentQuery>({
  name: undefined,
  phone: undefined,
  agentCode: undefined,
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
  // { title: 'ID', dataIndex: 'id', slotName: 'id' },
  { title: '学生姓名', dataIndex: 'name', slotName: 'name',width: 150 },
  { title: '代理商编码', dataIndex: 'agentCode', width: 100, ellipsis: true, tooltip: true },
  { title: '头像', dataIndex: 'avatar', slotName: 'avatar', width: 70 },
  { title: '手机号码', dataIndex: 'phone', slotName: 'phone',width: 130 },
  { title: '余额', dataIndex: 'paidBalance', slotName: 'paidBalance', width: 120, align: 'center' },
  // { title: '会员卡', dataIndex: 'activeCards', slotName: 'activeCards', width: 200 },
  // { title: '是否允许录课', dataIndex: 'enableRecording', slotName: 'enableRecording' },
  { title: '注册时间', dataIndex: 'registerTime', slotName: 'registerTime',width: 180 },
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
  queryForm.agentCode = undefined
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

const StudentAdjustBalanceModalRef = ref<InstanceType<typeof StudentAdjustBalanceModal>>()
// 充值
const onRecharge = (record: StudentResp) => {
  StudentAdjustBalanceModalRef.value?.onOpen(record.id, record.name, record.paidBalance || 0, 'RECHARGE')
}

// 扣费
const onDeduct = (record: StudentResp) => {
  StudentAdjustBalanceModalRef.value?.onOpen(record.id, record.name, record.paidBalance || 0, 'DEDUCT')
}

const StudentBalanceRecordsDrawerRef = ref<InstanceType<typeof StudentBalanceRecordsDrawer>>()
// 查看操作记录
const onViewRecords = (record: StudentResp) => {
  StudentBalanceRecordsDrawerRef.value?.onOpen(record.id, record.name)
}
</script>

<style scoped lang="scss"></style>
