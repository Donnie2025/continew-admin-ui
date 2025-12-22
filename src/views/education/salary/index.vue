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
      :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      :selected-keys="selectedRowKeys"
      @select="onSelect"
      @select-all="onSelectAll"
      @refresh="search"
    >
      <template #toolbar-left>
	    <a-input-search v-model="queryForm.teacherName" placeholder="请输入教师姓名" allow-clear @search="search" />
        <a-button-group>
          <a-button @click="previousWeek">
            <template #icon><icon-left /></template>
            <template #default>上一周</template>
          </a-button>
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
          <a-button @click="nextWeek">
            <template #icon><icon-right /></template>
            <template #default>下一周</template>
          </a-button>
        </a-button-group>
        <a-select 
          v-model="queryForm.isSettled" 
          placeholder="是否结算" 
          style="width: 150px"
          @change="search"
        >
          <a-option value="">全部</a-option>
          <a-option :value="1">已结算</a-option>
          <a-option :value="0">未结算</a-option>
        </a-select>
        <a-select 
          v-model="queryForm.groupName" 
          placeholder="请选择所属组" 
          allow-clear
          style="width: 150px"
          @change="search"
        >
          <a-option value="Rona">Rona</a-option>
          <a-option value="Mae">Mae</a-option>
          <a-option value="Lina">Lina</a-option>
          <a-option value="Ainie">Ainie</a-option>
          <a-option value="Mira">Mira</a-option>
        </a-select>
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
          <template #default>生成工资流水</template>
        </a-button>
        <a-button v-permission="['education:salary:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
        <a-button 
          v-permission="['education:salary:update']" 
          type="outline" 
          status="warning" 
          :disabled="selectedRowKeys.length === 0"
          @click="onBatchSettle"
        >
          <template #icon><icon-check-circle /></template>
          <template #default>批量结算 ({{ selectedRowKeys.length }})</template>
        </a-button>
        <div style="width: 100%; margin-top: 0px;">
          <a-space size="large">
            <a-tag color="orangered" size="large" style="font-size: 14px; padding: 8px 16px; font-weight: 500;">
              总课程数(Total Number): {{ totalCourseCount.toLocaleString('zh-CN') }}
            </a-tag>
            <a-tag color="arcoblue" size="large" style="font-size: 14px; padding: 8px 16px; font-weight: 500;">
              总金额(Total Amount): ₱{{ totalFinalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}
            </a-tag>
          </a-space>
        </div>
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
    <SalaryDetailDrawer ref="SalaryDetailDrawerRef" @settle-success="search" />
    <SalaryBatchImportModal ref="SalaryBatchImportModalRef" @import-success="search" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message, Modal } from '@arco-design/web-vue'
import SalaryAddModal from './SalaryAddModal.vue'
import SalaryDetailDrawer from './SalaryDetailDrawer.vue'
import SalaryBatchImportModal from './SalaryBatchImportModal.vue'
import { type SalaryResp, type SalaryQuery, deleteSalary, exportSalary, listSalary, updateSalaryStatus, getSalary, updateSalary, initializeWeeklySalaryData, batchSettleSalary, type SalaryBatchSettleReq } from '@/apis/education/salary'
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
  isSettled: '' as any, // 默认为空字符串，表示"全部"
  groupName: undefined,
  sort: ['id,desc']
})

// 清理查询参数，将空字符串转换为 undefined
const cleanQueryParams = (params: any) => {
  const cleaned = { ...params }
  if (cleaned.isSettled === '') {
    cleaned.isSettled = undefined
  }
  return cleaned
}

// 总金额和总课程数（所有符合条件的数据）
const totalFinalAmount = ref(0)
const totalCourseCount = ref(0)

// 表格行选择
const selectedRowKeys = ref<string[]>([])

// 单选处理
const onSelect = (rowKeys: string[]) => {
  selectedRowKeys.value = rowKeys
}

// 全选处理
const onSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRowKeys.value = dataList.value.map(item => item.id)
  } else {
    selectedRowKeys.value = []
  }
}

// 计算所有数据的总金额和总课程数
const calculateTotalAmount = async () => {
  try {
    // 使用最大允许的每页条数获取第一页数据
    const cleanedParams = cleanQueryParams(queryForm)
    const { data } = await listSalary({ 
      ...cleanedParams, 
      page: 1, 
      size: 1000 // 使用后端允许的最大值
    })
    if (data && data.list) {
      let totalAmount = 0
      let totalCount = 0
      
      // 统计第一页
      data.list.forEach((item: any) => {
        totalAmount += Number(item.courseAmount) || 0
        totalCount += Number(item.courseCount) || 0
      })
      
      // 如果有更多数据，继续获取
      const totalRecords = data.total || 0
      if (totalRecords > 1000) {
        const totalPages = Math.ceil(totalRecords / 1000)
        const promises = []
        for (let page = 2; page <= totalPages; page++) {
          promises.push(listSalary({ ...cleanedParams, page, size: 1000 }))
        }
        const results = await Promise.all(promises)
        results.forEach(result => {
          if (result.data && result.data.list) {
            result.data.list.forEach((item: any) => {
              totalAmount += Number(item.courseAmount) || 0
              totalCount += Number(item.courseCount) || 0
            })
          }
        })
      }
      
      totalFinalAmount.value = totalAmount
      totalCourseCount.value = totalCount
    }
  } catch (error) {
    console.error('计算总金额失败:', error)
    totalFinalAmount.value = 0
    totalCourseCount.value = 0
  }
}

const {
  tableData: dataList,
  loading,
  pagination,
  search: originalSearch,
  handleDelete
} = useTable((page) => listSalary({ ...cleanQueryParams(queryForm), ...page }), { immediate: true })

// 重写 search 方法，在搜索时计算总金额
const search = async () => {
  selectedRowKeys.value = [] // 清空选择
  await originalSearch()
  await calculateTotalAmount()
}

// 初始化时计算总金额
onMounted(() => {
  calculateTotalAmount()
})

const columns: TableInstance['columns'] = [
  { title: 'Start Date', dataIndex: 'startDate', slotName: 'startDate' },
  { title: 'End Date', dataIndex: 'endDate', slotName: 'endDate' },
  { title: 'Recv Name', dataIndex: 'recvName', slotName: 'recvName' },
  { title: 'Name', dataIndex: 'teacherName', slotName: 'teacherName' },
  { title: 'Course Count', dataIndex: 'courseCount', slotName: 'courseCount' },
  { title: 'Course Amount', dataIndex: 'courseAmount', slotName: 'courseAmount' },
  { title: 'Deduction', dataIndex: 'deductionAmount', slotName: 'deductionAmount' },
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
  queryForm.isSettled = '' as any // 重置为"全部"
  queryForm.groupName = undefined
  search()
}

// 上一周
const previousWeek = () => {
  const currentStart = queryForm.startDate ? dayjs(queryForm.startDate) : dayjs()
  const previousMonday = currentStart.subtract(1, 'week').isoWeekday(1).format('YYYY-MM-DD')
  const previousSunday = currentStart.subtract(1, 'week').isoWeekday(7).format('YYYY-MM-DD')
  queryForm.startDate = previousMonday
  queryForm.endDate = previousSunday
  search()
}

// 下一周
const nextWeek = () => {
  const currentStart = queryForm.startDate ? dayjs(queryForm.startDate) : dayjs()
  const nextMonday = currentStart.add(1, 'week').isoWeekday(1).format('YYYY-MM-DD')
  const nextSunday = currentStart.add(1, 'week').isoWeekday(7).format('YYYY-MM-DD')
  queryForm.startDate = nextMonday
  queryForm.endDate = nextSunday
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
          remark: salaryDetail.remark,
          recvName: salaryDetail.recvName
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

// 生成工资流水
const onInitializeWeeklySalary = () => {
  const startDate = queryForm.startDate
  const endDate = queryForm.endDate
  const dateRange = startDate && endDate ? `${startDate} ~ ${endDate}` : '本周'
  
  Modal.confirm({
    title: '确认操作',
    content: `确定要为所有符合条件的老师生成${dateRange}的工资流水吗？`,
    onOk: async () => {
      try {
        loading.value = true
        const { data } = await initializeWeeklySalaryData({
          startDate: queryForm.startDate,
          endDate: queryForm.endDate
        })
        Message.success(`成功生成 ${data} 条薪资记录`)
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

// 批量结算
const onBatchSettle = () => {
  if (selectedRowKeys.value.length === 0) {
    Message.warning('请选择要结算的薪资记录')
    return
  }

  // 检查选中的记录是否都是未结算状态
  const selectedRecords = dataList.value.filter(item => selectedRowKeys.value.includes(item.id))
  const settledRecords = selectedRecords.filter(record => String(record.isSettled).trim() === '1')
  
  if (settledRecords.length > 0) {
    const settledNames = settledRecords.map(record => record.teacherName).join(', ')
    Message.warning(`以下薪资记录已结算，无法重复结算: ${settledNames}`)
    return
  }

  // 获取要结算的老师名字
  const teacherNames = selectedRecords.map(record => record.teacherName).join(', ')

  Modal.confirm({
    title: '确认批量结算',
    content: `确定要将以下 ${selectedRowKeys.value.length} 条薪资记录标记为已结算吗？\n\n老师：${teacherNames}`,
    onOk: async () => {
      try {
        loading.value = true
        const req: SalaryBatchSettleReq = {
          ids: selectedRowKeys.value,
          remark: '批量结算操作'
        }
        const { data } = await batchSettleSalary(req)
        Message.success(`成功结算 ${data} 条薪资记录`)
        selectedRowKeys.value = [] // 清空选择
        search() // 刷新表格数据
      } catch (error) {
        console.error('批量结算失败:', error)
        Message.error('批量结算失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped lang="scss"></style>
