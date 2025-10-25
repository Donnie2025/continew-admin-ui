<template>
  <div class="gi_table_page">
    <GiTable
      title="薪资管理"
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
	    <a-input-search v-model="queryForm.teacherName" placeholder="请输入教师姓名" allow-clear @search="search" />
        <a-date-picker
          v-model="queryForm.startDate"
          placeholder="请选择起始日期"
          format="YYYY-MM-DD"
          style="height: 32px"
        />
        <a-date-picker
          v-model="queryForm.endDate"
          placeholder="请选择结束日期"
          format="YYYY-MM-DD"
          style="height: 32px"
        />
		<a-radio-group v-model="queryForm.isSettled" :options="yes_no" @change="search"/>
	    <a-input-search v-model="queryForm.groupName" placeholder="请输入所属组" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:salary:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:salary:create']" type="outline" status="success" @click="onBatchImport">
          <template #icon><icon-import /></template>
          <template #default>批量导入</template>
        </a-button>
        <a-button v-permission="['education:salary:create']" type="outline" status="success" @click="onInitializeWeeklySalary">
          <template #icon><icon-calendar /></template>
          <template #default>生成本周工资流水</template>
        </a-button>
        <a-button v-permission="['education:salary:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #isSettled="{ record }">
        <GiCellTag :value="record.isSettled" :dict="yes_no" />
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:salary:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:salary:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link 
            v-if="String(record.isSettled).trim() === '0'"
            v-permission="['education:salary:update']" 
            title="标记为已结算"
            @click="onToggleStatus(record)"
          >
            结算
          </a-link>
          <a-link
            v-permission="['education:salary:delete']"
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

    <SalaryAddModal ref="SalaryAddModalRef" @save-success="search" />
    <SalaryDetailDrawer ref="SalaryDetailDrawerRef" />
    <SalaryBatchImportModal ref="SalaryBatchImportModalRef" @import-success="search" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import SalaryAddModal from './SalaryAddModal.vue'
import SalaryDetailDrawer from './SalaryDetailDrawer.vue'
import SalaryBatchImportModal from './SalaryBatchImportModal.vue'
import { type SalaryResp, type SalaryQuery, deleteSalary, exportSalary, listSalary, updateSalaryStatus, getSalary, updateSalary, initializeWeeklySalaryData } from '@/apis/education/salary'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

defineOptions({ name: 'Salary' })

const { yes_no } = useDict('yes_no')

// 获取本周一和周日
const getThisWeekRange = () => {
  const monday = dayjs().isoWeekday(1).format('YYYY-MM-DD')
  const sunday = dayjs().isoWeekday(7).format('YYYY-MM-DD')
  return { monday, sunday }
}

const { monday: defaultStartDate, sunday: defaultEndDate } = getThisWeekRange()

const queryForm = reactive<SalaryQuery>({
  teacherName: undefined,
  startDate: defaultStartDate,
  endDate: defaultEndDate,
  status: '1', // 默认只查询生效的数据
  isSettled: undefined,
  groupName: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listSalary({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: 'Start Date', dataIndex: 'startDate', slotName: 'startDate' },
  { title: 'End Date', dataIndex: 'endDate', slotName: 'endDate' },
  { title: 'Name', dataIndex: 'teacherName', slotName: 'teacherName' },
  { title: 'Course Count', dataIndex: 'courseCount', slotName: 'courseCount' },
  { title: 'Course Amount', dataIndex: 'courseAmount', slotName: 'courseAmount' },
  { title: 'Deduction', dataIndex: 'deductionAmount', slotName: 'deductionAmount' },
  { title: 'Tip', dataIndex: 'tipAmount', slotName: 'tipAmount' },
  { title: 'Final Amount', dataIndex: 'finalAmount', slotName: 'finalAmount' },
  { title: 'Is Settled', dataIndex: 'isSettled', slotName: 'isSettled' },
  { title: 'Rate', dataIndex: 'rate', slotName: 'rate' },
  {
    title: 'Action',
    dataIndex: 'action',
    slotName: 'action',
    width: 200,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:salary:get', 'education:salary:update', 'education:salary:delete'])
  }
]

// 重置
const reset = () => {
  const { monday, sunday } = getThisWeekRange()
  queryForm.teacherName = undefined
  queryForm.startDate = monday
  queryForm.endDate = sunday
  queryForm.status = '1' // 默认只查询生效的数据
  queryForm.isSettled = undefined
  queryForm.groupName = undefined
  search()
}

// 删除
const onDelete = (record: SalaryResp) => {
  return handleDelete(() => deleteSalary(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportSalary(queryForm))
}

const SalaryAddModalRef = ref<InstanceType<typeof SalaryAddModal>>()
// 新增
const onAdd = () => {
  SalaryAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: SalaryResp) => {
  SalaryAddModalRef.value?.onUpdate(record.id)
}

const SalaryDetailDrawerRef = ref<InstanceType<typeof SalaryDetailDrawer>>()
// 详情
const onDetail = (record: SalaryResp) => {
  SalaryDetailDrawerRef.value?.onOpen(record.id)
}

// 更改状态
const onToggleStatus = (record: SalaryResp) => {
  if (String(record.isSettled).trim() !== '0') {
    Message.warning('已结算的记录不能更改状态')
    return
  }
  
  Modal.confirm({
    title: '确认操作',
    content: '确定要将此记录标记为已结算吗？',
    onOk: async () => {
      try {
        loading.value = true
        // 先获取详细信息
        const { data: salaryDetail } = await getSalary(record.id)
        // 只更改结算状态字段
        await updateSalary({ 
          teacherId: Number(salaryDetail.teacherId),
          teacherName: salaryDetail.teacherName,
          startDate: salaryDetail.startDate,
          endDate: salaryDetail.endDate,
          courseCount: Number(salaryDetail.courseCount),
          courseAmount: salaryDetail.courseAmount,
          deductionAmount: salaryDetail.deductionAmount,
          tipAmount: salaryDetail.tipAmount,
          status: Number(salaryDetail.status),
          isSettled: 1,
          rate: Number(salaryDetail.rate),
          groupName: salaryDetail.groupName,
          remark: salaryDetail.remark
        }, record.id)
        Message.success('状态已更改为已结算')
        search() // 刷新表格数据
      } catch (error) {
        console.error('更改状态失败:', error)
        Message.error('状态更改失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 生成本周工资流水
const onInitializeWeeklySalary = () => {
  Modal.confirm({
    title: '确认操作',
    content: '确定要为所有符合条件的老师生成本周的工资流水吗？',
    onOk: async () => {
      try {
        loading.value = true
        const { data, message } = await initializeWeeklySalaryData()
        Message.success(message || `成功生成 ${data} 条薪资记录`)
        search() // 刷新表格数据
      } catch (error) {
        console.error('生成工资流水失败:', error)
        Message.error('生成工资流水失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const SalaryBatchImportModalRef = ref<InstanceType<typeof SalaryBatchImportModal>>()
// 批量导入
const onBatchImport = () => {
  SalaryBatchImportModalRef.value?.onOpen()
}
</script>

<style scoped lang="scss"></style>
