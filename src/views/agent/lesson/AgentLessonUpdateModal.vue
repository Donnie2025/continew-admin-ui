<template>
  <a-modal
    v-model:visible="visible"
    title="修改课堂"
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
import { getAgentLesson, updateAgentLesson } from '@/apis/agent/lesson'
import { listActiveTeachers } from '@/apis/education/teacher'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const formRef = ref<InstanceType<typeof GiForm>>()

const teacherOptions = ref<{ label: string; value: string | number }[]>([])
const teacherLoading = ref(false)

const fetchTeacherOptions = async (keyword = '') => {
  teacherLoading.value = true
  try {
    const { data } = await listActiveTeachers(keyword)
    teacherOptions.value = (data || []).map(item => ({ label: item.name, value: item.id }))
  } catch (error) {
    console.error('获取教师列表失败', error)
  } finally {
    teacherLoading.value = false
  }
}

const handleTeacherSearchChange = useDebounceFn((keyword: string) => {
  fetchTeacherOptions(keyword)
}, 300)

const seatNumOptions = Array.from({ length: 12 }, (_, index) => ({
  label: `1V${index + 1}`,
  value: index + 1
}))

const [form, resetForm] = useResetReactive({
  courseId: '',
  courseUid: '',
  name: '',
  teacherId: '',
  startTime: null as any,
  duration: 25,
  seatNum: 6,
  recordState: 0,
  remark: ''
})

const columns: ColumnItem[] = reactive([
  { field: 'courseUid', hide: true, required: true },
  { label: '课堂活动名称', field: 'name', type: 'input', span: 24, required: true },
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
      notFoundContent: '未找到匹配教师',
      onSearch: handleTeacherSearchChange
    }
  },
  {
    label: '活动开始时间',
    field: 'startTime',
    type: 'date-picker',
    span: 24,
    required: true,
    props: { showTime: true, format: 'YYYY-MM-DD HH:mm', placeholder: '请选择活动开始时间' }
  },
  {
    label: '课堂时长(分钟)',
    field: 'duration',
    type: 'input-number',
    span: 24,
    required: true,
    props: { min: 15, max: 1440, step: 5, defaultValue: 25, placeholder: '请输入课堂时长，单位：分钟' }
  },
  {
    label: '上台人数',
    field: 'seatNum',
    type: 'select',
    span: 24,
    required: true,
    props: { options: seatNumOptions, placeholder: '请选择上台人数' }
  },
  {
    label: '录制状态',
    field: 'recordState',
    type: 'radio-group',
    span: 24,
    props: { options: [{ label: '否', value: 0 }, { label: '是', value: 1 }] }
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: { placeholder: '请输入备注信息', maxLength: 500, showWordLimit: true, autoSize: { minRows: 3, maxRows: 6 } }
  }
])

const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  fetchTeacherOptions()
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false

    if (!form.startTime) {
      Message.error('请选择活动开始时间')
      return false
    }

    const startTime = new Date(form.startTime)
    startTime.setSeconds(0)

    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:00`
    }

    const submitData = {
      courseId: form.courseId,
      courseUid: form.courseUid,
      name: form.name,
      teacherId: String(form.teacherId),
      startTime: formatDate(startTime),
      duration: form.duration,
      seatNum: form.seatNum,
      recordState: form.recordState,
      remark: form.remark
    }

    await updateAgentLesson(submitData, dataId.value)
    Message.success('修改成功')
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getAgentLesson(id)

  const lessonData = { ...data } as any
  if (lessonData.startTime && lessonData.endTime) {
    const startTime = new Date(lessonData.startTime)
    const endTime = new Date(lessonData.endTime)
    lessonData.duration = Math.round((endTime.getTime() - startTime.getTime()) / (60 * 1000))
    lessonData.startTime = startTime
  } else {
    lessonData.duration = lessonData.duration || 25
  }

  Object.assign(form, lessonData)
  visible.value = true
}

onMounted(() => {
  fetchTeacherOptions()
})

defineExpose({ onUpdate })
</script>

<style scoped lang="scss"></style>
