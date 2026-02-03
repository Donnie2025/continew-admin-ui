<template>
  <a-modal
    v-model:visible="visible"
    title="修改学生姓名"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { updateStudentName } from '@/apis/education/student'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const studentId = ref('')
const studentName = ref('')
const visible = ref(false)
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({
  currentName: '',
  newName: ''
})

const columns: ColumnItem[] = reactive([
  {
    label: '当前姓名',
    field: 'currentName',
    type: 'input',
    span: 24,
    props: {
      disabled: true,
      placeholder: '当前学生姓名'
    },
    rules: false
  },
  {
    label: '新姓名',
    field: 'newName',
    type: 'input',
    span: 24,
    required: true,
    props: {
      placeholder: '请输入新的学生姓名'
    },
    rules: [
      { required: true, message: '请输入新的学生姓名' },
      { minLength: 1, message: '姓名不能为空' },
      { maxLength: 24, message: '学生姓名不能超过24个字符' }
    ]
  }
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  studentId.value = ''
  studentName.value = ''
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false

    // 检查新姓名是否与当前姓名相同
    if (form.newName.trim() === form.currentName.trim()) {
      Message.warning('新姓名与当前姓名相同，无需修改')
      return false
    }
    
    await updateStudentName(studentId.value, form.newName.trim())
    
    Message.success('学生姓名修改成功，已同步到ClassIn平台')
    emit('save-success')
    return true
  } catch (error: any) {
    Message.error(error.message || '修改学生姓名失败')
    return false
  }
}

// 打开修改姓名对话框
const onOpen = async (id: string, name: string) => {
  reset()
  studentId.value = id
  studentName.value = name
  form.currentName = name
  form.newName = ''
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="less">
</style>
