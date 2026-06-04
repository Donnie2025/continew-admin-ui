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
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize, useDebounceFn } from '@vueuse/core'
import { getLesson, addLesson, updateLesson } from '@/apis/education/lesson'
import { listCourse } from '@/apis/education/course'
import { listActiveTeachers } from '@/apis/education/teacher'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改课堂' : '新增课堂'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { yes_no,class_status } = useDict('yes_no','class_status')

// 课程列表
const courseOptions = ref<{ label: string; value: string | number; courseUid?: string | number }[]>([])
const courseLoading = ref(false)

// 教师列表
const teacherOptions = ref<{ label: string; value: string | number }[]>([])
const teacherLoading = ref(false)

// 课程选项加载（已移除，课堂管理页面只读）
// const fetchCourseOptions = () => {
//   // 课堂管理页面只有修改功能，课程字段只读，无需加载选项
// }

// 获取教师列表
const fetchTeacherOptions = async (keyword = '') => {
  teacherLoading.value = true
  try {
    const { data } = await listActiveTeachers(keyword)
    
    teacherOptions.value = (data || []).map(item => {
      return {
        label: item.name,
        value: item.id
      }
    })
  } catch (error) {
    console.error('获取教师列表失败', error)
  } finally {
    teacherLoading.value = false
  }
}

// 课程搜索处理（课堂管理页面不使用）
const handleCourseSearchChange = () => {
  // 课堂管理页面课程字段只读，不需要搜索功能
}

// 处理教师搜索关键词变化
const handleTeacherSearchChange = useDebounceFn((keyword: string) => {
  fetchTeacherOptions(keyword)
}, 300)


// 教师选择变更时自动填充teacherId
const handleTeacherChange = (value: string | number) => {
  // 不需要额外处理，因为teacherId就是选中的值
  // 如果后端需要额外处理，可以在这里添加逻辑
}

// 上台人数选项
const seatNumOptions = Array.from({ length: 12 }, (_, index) => {
  const value = index + 1
  return {
    label: `1V${index + 1}`,
    value
  }
})

const [form, resetForm] = useResetReactive({
  courseId: '',
  courseName: '', // 用于编辑模式下显示课程名称
  courseUid: '',
  name: '',
  teacherId: '',
  startTime: null,
  duration: 25,
  seatNum: 6,
  recordState: 0,
  remark: ''
})

const columns: ColumnItem[] = reactive([
  
  // ClassIn课程ID作为隐藏字段，不在表单中显示但会提交到后端
  {
    field: 'courseUid',
    hide: true,  // 隐藏此字段
    required: true,
  },
  {
    label: '课堂活动名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '主讲教师',
    field: 'teacherId',
    type: 'select',
    span: 24,
    required: true,
    props: {
      allowSearch: true,
      allowClear: true,
      loading: teacherLoading,
      options: teacherOptions,
      placeholder: '请输入教师名称搜索',
      filterOption: false,
      showSearch: true,
      defaultActiveFirstOption: false,
      notFoundContent: teacherLoading.value ? '加载中...' : '未找到匹配教师',
      onSearch: handleTeacherSearchChange,
      onChange: handleTeacherChange
    }
  },
  {
    label: '活动开始时间',
    field: 'startTime',
    type: 'date-picker',
    span: 24,
    required: true,
    props: {
      showTime: true,
      format: 'YYYY-MM-DD HH:mm',
      placeholder: '请选择活动开始时间'
    }
  },
  {
    label: '课堂时长(分钟)',
    field: 'duration',
    type: 'input-number',
    span: 24,
    required: true,
    props: {
      min: 15,
      max: 1440,
      step: 5,
      defaultValue: 25,
      placeholder: '请输入课堂时长，单位：分钟'
    }
  },
  {
    label: '上台人数',
    field: 'seatNum',
    type: 'select',
    span: 24,
    required: true,
    props: {
      options: seatNumOptions,
      placeholder: '请选择上台人数'
    }
  },
  {
    label: '录制状态',
    field: 'recordState',
    type: 'radio-group',
    span: 24,
    props: {
      options: [
        { label: '否', value: 0 },
        { label: '是', value: 1 }
      ]
    },
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: {
      placeholder: '请输入备注信息',
      maxLength: 500,
      showWordLimit: true,
      autoSize: { minRows: 3, maxRows: 6 }
    },
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  // 课堂管理页面只有修改功能，不需要加载课程选项
  fetchTeacherOptions()
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false

    // 根据开始时间和时长计算结束时间
    if (!form.startTime) {
      Message.error('请选择活动开始时间')
      return false
    }
    
    const startTime = new Date(form.startTime)
    // 确保秒数为0
    startTime.setSeconds(0)
    const endTime = new Date(startTime.getTime() + form.duration * 60 * 1000)
    
    // 格式化日期为字符串，保留用户选择的本地时间
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:00`
    }
    
    // 准备提交数据，确保使用正确的字段名
    const submitData: Record<string, any> = {
      ...form,
      startTime: formatDate(startTime),
      endTime: formatDate(endTime)
    }
    
    // 如果存在createBy，将其转换为createUser
    if ('createBy' in submitData) {
      submitData.createUser = submitData.createBy
      delete submitData.createBy
    }
    
    // 如果存在updateBy，将其转换为updateUser
    if ('updateBy' in submitData) {
      submitData.updateUser = submitData.updateBy
      delete submitData.updateBy
    }
    
    if (isUpdate.value) {
      await updateLesson(submitData, dataId.value)
      Message.success('修改成功')
    } else {
      await addLesson(submitData)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增（课堂管理页面不使用此功能）
const onAdd = async () => {
  // 课堂管理页面只有修改功能，不使用新增
  console.warn('课堂管理页面不支持新增功能')
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getLesson(id)
  
  // 如果有开始时间和结束时间，计算课堂时长
  const lessonData = { ...data } as any
  if (lessonData.startTime && lessonData.endTime) {
    const startTime = new Date(lessonData.startTime)
    const endTime = new Date(lessonData.endTime)
    lessonData.duration = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000))
    
    // 确保startTime是Date对象，以便正确显示时间（包括秒）
    lessonData.startTime = startTime
  } else {
    lessonData.duration = 25 // 默认25分钟
  }
  
  Object.assign(form, lessonData)
  
  // 编辑模式下课程字段只读，无需加载课程选项
  
  // 教师选项在组件初始化时已加载，无需重复加载
  
  visible.value = true
}

// 初始化时只加载教师列表，课程列表按需加载
onMounted(() => {
  fetchTeacherOptions()
})

defineExpose({
  onAdd,
  onUpdate
})
</script>

<style scoped lang="scss"></style>
