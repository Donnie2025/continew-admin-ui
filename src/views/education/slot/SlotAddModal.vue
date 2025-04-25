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
import { getSlot, addSlot, updateSlot } from '@/apis/education/slot'
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
const title = computed(() => (isUpdate.value ? '修改课程管理' : '新增课程管理'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { yes_no,status } = useDict('yes_no','status')

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
  {
    label: '所属教师ID',
    field: 'teacherId',
    type: 'select', 
    span: 24,
    required: true,
  },
  {
    label: '教师名字',
    field: 'teacherName',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '开课日期（格式：YYYYMMDD）',
    field: 'startDate',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '开课时间（格式：HH:MM）',
    field: 'startTime',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '课程时长（单位为分钟）',
    field: 'duration',
    type: 'input',
    span: 24,
  },
  {
    label: '是否在线教室（0：否；1：是）',
    field: 'isOnline',
    type: 'radio-group',
    span: 24,
    props: {
      options: yes_no,
    },
  },
  {
    label: '所属机构ID',
    field: 'institutionId',
    type: 'input',
    span: 24,
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
    if (isUpdate.value) {
      await updateSlot(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addSlot(form)
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
  const { data } = await getSlot(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
