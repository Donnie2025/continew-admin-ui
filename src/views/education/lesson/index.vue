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
	    <a-input-search v-model="queryForm.name" placeholder="请输入课堂活动名称" allow-clear @search="search" @keyup.enter="search" />
	    <a-select v-model="queryForm.agentCode" :options="agentOptions" placeholder="请选择代理机构" allow-clear style="width: 150px" @change="search" />
	    <a-select v-model="queryForm.courseStatus" placeholder="课程状态" allow-clear style="width: 120px" @change="search">
	      <a-option value="started">已开课</a-option>
	      <a-option value="not_started">未开课</a-option>
	    </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
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
      <template #seatNum="{ record }">
        <span>1V{{ (record as any).seatNum ?? 0 }}</span>
      </template>
      <template #materialName="{ record }">
        <span v-if="(record as any).materialName">{{ (record as any).materialName }}</span>
        <span v-else style="color: #999;">--</span>
      </template>
      <template #agentCode="{ record }">
        <span>{{ record.agentCode || '-' }}</span>
      </template>
      <template #remark="{ record }">
        <span>{{ record.remark}}</span>
      </template>
      <template #startTime="{ record }">
        <span>{{ formatDateTime(record.startTime) }} ({{ getDayOfWeek(record.startTime) }})</span>
      </template>
      <template #estimatedCost="{ record }">
        <span>{{ record.estimatedCost ? `¥${record.estimatedCost}` : '-' }}</span>
      </template>
      <template #status="{ record }">
        <GiCellTag :value="record.status" :dict="class_status" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:lesson:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link title="教材" @click="onSetMaterial(record as LessonResp)">教材</a-link>
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
    <LessonMaterialModal ref="LessonMaterialModalRef" @save-success="search" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import LessonAddModal from './LessonAddModal.vue'
import LessonDetailDrawer from './LessonDetailDrawer.vue'
import LessonMaterialModal from './LessonMaterialModal.vue'
import { type LessonResp, type LessonQuery, deleteLesson, exportLesson, listLesson } from '@/apis/education/lesson'
import { listAgentOptions, type AgentOption } from '@/apis/education/agent'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import { onMounted } from 'vue'

defineOptions({ name: 'Lesson' })

const { yes_no,class_status } = useDict('yes_no','class_status')

// 代理机构列表
const agentOptions = ref<{ label: string; value: string }[]>([])

// 格式化日期时间，去掉秒数
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return ''
  // 如果是完整的日期时间格式，截取到分钟
  if (dateTime.includes(':')) {
    return dateTime.substring(0, 16) // 格式：2026-02-09 20:30
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

const queryForm = reactive<LessonQuery>({
  courseId: undefined,
  courseUid: undefined,
  name: undefined,
  agentCode: undefined,
  teacherUid: undefined,
  startTime: undefined,
  endTime: undefined,
  courseStatus: 'not_started',
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
  { title: '课堂名称', dataIndex: 'name', slotName: 'name' , width: 170},
  { title: '代理机构', dataIndex: 'agentCode', slotName: 'agentCode', width: 80, align: 'center' },
  { title: '开始时间', dataIndex: 'startTime', slotName: 'startTime', width: 150 },
  { title: '座位数', dataIndex: 'seatNum', slotName: 'seatNum', width: 80 },
  { title: '是否录制', dataIndex: 'recordState', slotName: 'recordState', width: 80 },
  { title: '教材', dataIndex: 'materialName', slotName: 'materialName', width: 200, ellipsis: true, tooltip: true, align: 'left' },
  { title: '备注', dataIndex: 'remark', slotName: 'remark', width: 200 },
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
  queryForm.agentCode = undefined
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

const LessonMaterialModalRef = ref<InstanceType<typeof LessonMaterialModal>>()
const onSetMaterial = (record: LessonResp) => {
  LessonMaterialModalRef.value?.onOpen(record.id, record.name, record.courseId, record.materialId ?? null, record.materialName ?? null)
}

// 加载代理机构列表
const fetchAgentOptions = async () => {
  const { data } = await listAgentOptions()
  agentOptions.value = (data || []).map((item: AgentOption) => ({
    label: item.name,
    value: item.code
  }))
}

// 页面加载时获取代理机构列表
onMounted(() => {
  fetchAgentOptions()
})
</script>

<style scoped lang="scss"></style>
