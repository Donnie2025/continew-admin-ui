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
import { useWindowSize } from '@vueuse/core'
import { getLesson, addLesson, updateLesson } from '@/apis/education/lesson'
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

// 上台人数选项
const seatNumOptions = Array.from({ length: 12 }, (_, index) => {
  const value = index + 2 // 从2开始，对应1V1
  return {
    label: `1V${index + 1}`,
    value
  }
})

const [form, resetForm] = useResetReactive({
  courseId: '',
  courseUid: '',
  name: '',
  teacherUid: '',
  startTime: null,
  duration: 25,
  seatNum: 2, // 默认1V1，值为2
  recordState: 0,
  liveState: 0,
  openState: 0
})

const columns: ColumnItem[] = reactive([
  {
    label: '课程ID',
    field: 'courseId',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: 'ClassIn 课程ID',
    field: 'courseUid',
    type: 'input',
    span: 24,
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
    label: '主讲教师UID',
    field: 'teacherUid',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '活动开始时间',
    field: 'startTime',
    type: 'date-picker',
    span: 24,
    required: true,
    props: {
      showTime: {
        format: 'HH:mm',
        defaultValue: '00:00'
      },
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
      options: yes_no,
    },
  },
  {
    label: '直播状态',
    field: 'liveState',
    type: 'input',
    span: 24,
    props: {
      options: yes_no,
    },
  },
  {
    label: '公开状态',
    field: 'openState',
    type: 'input',
    span: 24,
    props: {
      options: yes_no,
    },
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
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
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
