<template>
  <div class="gi_table_page">
    <GiTable
      title="机构课堂管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 900 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input-search v-model="queryForm.name" placeholder="请输入课堂名称" allow-clear @search="search" @keyup.enter="search" />
        <a-select v-model="queryForm.courseStatus" placeholder="课程状态" allow-clear style="width: 120px" @change="search">
          <a-option value="not_started">未开课</a-option>
          <a-option value="started">已开课</a-option>
        </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>

      <template #startTime="{ record }">
        <span>{{ formatDateTime(record.startTime) }} ({{ getDayOfWeek(record.startTime) }})</span>
      </template>
      <template #recordState="{ record }">
        <GiCellTag :value="record.recordState" :dict="yes_no" />
      </template>
      <template #estimatedCost="{ record }">
        <span>{{ record.estimatedCost ? `¥${record.estimatedCost}` : '-' }}</span>
      </template>
      <template #remark="{ record }">
        <span>{{ record.remark || '-' }}</span>
      </template>
      <template #seatNum="{ record }">
        <span>1V{{ (record as any).seatNum ?? 0 }}</span>
      </template>
      <template #materialName="{ record }">
        <span v-if="record.materialName">{{ record.materialName }}</span>
        <span v-else style="color: #999;">--</span>
      </template>

      <template #action="{ record }">
        <a-space>
          <a-link title="教材" @click="onSetMaterial(record as AgentLessonResp)">设置教材</a-link>
          <a-link v-permission="['agent:lesson:update']" title="修改" @click="onUpdate(record as AgentLessonResp)">修改</a-link>
<!--          <a-link v-permission="['agent:lesson:get']" title="详情" @click="onDetail(record as AgentLessonResp)">详情</a-link>-->
          <a-link title="删除" status="danger" @click="onDelete(record as AgentLessonResp)">删除</a-link>
        </a-space>
      </template>
    </GiTable>

    <!-- 编辑弹窗 -->
    <LessonAddModal ref="LessonAddModalRef" @save-success="search" />
    <!-- 课节详情抽屉 -->
    <LessonDetailDrawer ref="LessonDetailDrawerRef" />
    <!-- 设置教材弹窗 -->
    <LessonMaterialModal ref="LessonMaterialModalRef" @save-success="search" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Modal, Message } from '@arco-design/web-vue'
import LessonAddModal from './AgentLessonUpdateModal.vue'
import LessonDetailDrawer from './LessonDetailDrawer.vue'
import LessonMaterialModal from './LessonMaterialModal.vue'
import { type AgentLessonResp, listAgentLessons, deleteAgentLesson } from '@/apis/agent/lesson'
import { useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'

defineOptions({ name: 'AgentLesson' })

const { yes_no } = useDict('yes_no')

// 格式化日期时间，去掉秒数
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return ''
  if (dateTime.includes(':')) {
    return dateTime.substring(0, 16)
  }
  return dateTime
}

// 根据日期时间计算周几
const getDayOfWeek = (dateTime: string) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  if (isNaN(date.getTime())) return '-'
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return dayNames[date.getDay()]
}

// 查询表单
const queryForm = reactive({
  name: undefined as string | undefined,
  courseStatus: 'not_started' as string | undefined,
  sort: ['startTime,asc'] as string[]
})

const {
  tableData: dataList,
  loading,
  pagination,
  search
} = useTable((page) => listAgentLessons({ ...queryForm, ...page }), { immediate: true })

const columns: TableInstance['columns'] = [
  { title: '课堂名称', dataIndex: 'name', slotName: 'name',width: 180 },
  { title: '教师', dataIndex: 'teacherName', width: 60 },
  { title: '开始时间', dataIndex: 'startTime', slotName: 'startTime', width: 170, align: 'center' },
  // { title: '时长(分钟)', dataIndex: 'duration', width: 80, align: 'center' },
  { title: '座位数', dataIndex: 'seatNum', slotName: 'seatNum', width: 80, align: 'center' },
  // { title: '是否录制', dataIndex: 'recordState', slotName: 'recordState', width: 80, align: 'center' },
  { title: '教材', dataIndex: 'materialName', slotName: 'materialName', width: 200, ellipsis: true, tooltip: true, align: 'left' },
  { title: '备注', dataIndex: 'remark', slotName: 'remark', width: 180 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 180,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined
  }
]

// 重置
const reset = () => {
  queryForm.name = undefined
  queryForm.courseStatus = 'not_started'
  search()
}

// 修改
const LessonAddModalRef = ref<InstanceType<typeof LessonAddModal>>()
const onUpdate = (record: AgentLessonResp) => {
  LessonAddModalRef.value?.onUpdate(record.id)
}

// 详情
const LessonDetailDrawerRef = ref<InstanceType<typeof LessonDetailDrawer>>()
const onDetail = (record: AgentLessonResp) => {
  LessonDetailDrawerRef.value?.onOpen(record.id)
}

// 设置教材
const LessonMaterialModalRef = ref<InstanceType<typeof LessonMaterialModal>>()
const onSetMaterial = (record: AgentLessonResp) => {
  LessonMaterialModalRef.value?.onOpen(record.id, record.name, record.courseId, record.materialId ?? null, record.materialName ?? null)
}

// 删除
const onDelete = (record: AgentLessonResp) => {
  Modal.warning({
    title: '提示',
    content: `确定要删除课堂 "${record.name}" 吗？`,
    hideCancel: false,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteAgentLesson(record.id)
        Message.success('删除成功')
        search()
      } catch (error) {
        console.error('删除失败:', error)
      }
    }
  })
}
</script>

<style scoped lang="scss"></style>
