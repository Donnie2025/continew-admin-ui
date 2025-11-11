<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 600 ? 600 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns">
      <!-- 自定义日期范围选择器插槽 -->
      <template #dateRange>
        <a-range-picker
          v-model="form.dateRange"
          style="width: 100%"
          :placeholder="['起始日期', '结束日期']"
          :show-time="false"
          :shortcuts="dateShortcuts"
          shortcuts-position="left"
          value-format="YYYY-MM-DD"
          allow-clear
        />
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getSalary, addSalary, updateSalary } from '@/apis/education/salary'
import { listActiveTeachers, type TeacherResp } from '@/apis/education/teacher'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import type { ShortcutType } from '@arco-design/web-vue'
import dayjs from 'dayjs'

// 定义表单数据类型
interface FormData {
  teacherId?: number | string;
  dateRange?: string[];
  startDate?: string;
  endDate?: string;
  courseCount?: number | string;
  deductionAmount?: number | string;
  tipAmount?: number | string;
  remark?: string;
  recvName?: string;
  [key: string]: any;
}

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改薪资' : '新增薪资'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { yes_no } = useDict('yes_no')

// 教师列表数据
const teacherOptions = ref<Array<{ label: string; value: number }>>([])
// 搜索教师的加载状态
const teacherLoading = ref(false)

// 搜索教师列表
const searchTeachers = async (keyword: string) => {
  teacherLoading.value = true
  try {
    const { data } = await listActiveTeachers(keyword)
    teacherOptions.value = data.map(item => ({
      label: `${item.name}${item.groupName ? ` (${item.groupName})` : ''}`, 
      value: item.id
    }))
  } catch (error) {
    console.error('获取教师列表失败', error)
  } finally {
    teacherLoading.value = false
  }
}

// 初始加载教师列表
onMounted(() => {
  searchTeachers('')
})

const [form, resetForm] = useResetReactive<FormData>({
  dateRange: []
})

// 监听表单中日期范围的变化
const handleDateRangeChange = (dates: string[]) => {
  console.log('日期范围变化:', dates)
  if (dates && dates.length === 2) {
    form.dateRange = dates
  }
}

const columns: ColumnItem[] = reactive([
  {
    label: '教师',
    field: 'teacherId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      allowSearch: true,
      loading: teacherLoading,
      options: teacherOptions,
      filterOption: false,
      placeholder: '请输入教师姓名搜索',
      onSearch: (value: string) => {
        searchTeachers(value)
      }
    }
  },
  {
    label: '日期范围',
    field: 'dateRange',
    type: 'custom',
    span: 24,
    required: true
  },
  {
    label: '课程总数',
    field: 'courseCount',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '扣款金额',
    field: 'deductionAmount',
    type: 'input',
    span: 24,
  },
  {
    label: '收款人姓名',
    field: 'recvName',
    type: 'input',
    span: 24,
  },
  {
    label: '备注',
    field: 'remark',
    type: 'input',
    span: 24,
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

// 保存前预处理表单数据
const preprocessForm = (formData: FormData): FormData => {
  const processedForm = { ...formData }
  // 处理日期范围
  if (processedForm.dateRange && processedForm.dateRange.length === 2) {
    processedForm.startDate = processedForm.dateRange[0]
    processedForm.endDate = processedForm.dateRange[1]
    // 不删除dateRange，为了前端展示需要保留
  }
  
  console.log('处理后的表单数据:', processedForm)
  return processedForm
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    
    console.log('提交前表单数据:', form)
    
    // 处理日期范围
    const formData = preprocessForm({ ...form })
    const submitData = { ...formData }
    // 提交前删除不需要的字段
    delete submitData.dateRange
    
    if (isUpdate.value) {
      await updateSalary(submitData, dataId.value)
      Message.success('修改成功')
    } else {
      await addSalary(submitData)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    console.error('保存失败:', error)
    return false
  }
}

// 新增
const onAdd = async () => {
  reset()
  dataId.value = ''
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  try {
    const { data } = await getSalary(id)
    console.log('获取到的详情数据:', data)
    
    // 处理日期范围
    if (data.startDate && data.endDate) {
      // 直接修改form对象
      form.dateRange = [data.startDate, data.endDate]
      console.log('设置日期范围:', form.dateRange)
    }
    
    // 再次确认日期范围是否设置正确
    setTimeout(() => {
      console.log('更新后的表单数据:', form)
    }, 0)
    
    // 将其他字段复制到form
    Object.assign(form, data)
    visible.value = true
  } catch (error) {
    console.error('获取详情失败:', error)
    Message.error('获取详情失败')
  }
}

// 定义日期快捷选项
const dateShortcuts = computed<ShortcutType[]>(() => [
  {
    label: '当前周',
    value: () => [
      dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD'), // 周一为一周开始
      dayjs().endOf('week').add(1, 'day').format('YYYY-MM-DD')    // 周日为一周结束
    ]
  },
  {
    label: '上一周',
    value: () => [
      dayjs().subtract(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD'),
      dayjs().subtract(1, 'week').endOf('week').add(1, 'day').format('YYYY-MM-DD')
    ]
  },
  {
    label: '下一周',
    value: () => [
      dayjs().add(1, 'week').startOf('week').add(1, 'day').format('YYYY-MM-DD'),
      dayjs().add(1, 'week').endOf('week').add(1, 'day').format('YYYY-MM-DD')
    ]
  }
])

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
