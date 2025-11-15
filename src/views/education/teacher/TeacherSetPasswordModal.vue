<template>
  <a-modal
    v-model:visible="visible"
    title="设置密码"
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
import { setTeacherPassword } from '@/apis/education/teacher'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const teacherId = ref('')
const teacherName = ref('')
const visible = ref(false)
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({
  teacherName: '',
  password: ''
})

const columns: ColumnItem[] = reactive([
  {
    label: '教师姓名',
    field: 'teacherName',
    type: 'input',
    span: 24,
    props: {
      disabled: true,
      placeholder: '教师姓名'
    },
    rules: false
  },
  {
    label: '新密码',
    field: 'password',
    type: 'input',
    span: 24,
    required: true,
    props: {
      type: 'password',
      showPassword: true,
      placeholder: '请输入新密码'
    },
    rules: [
      { required: true, message: '请输入新密码' },
      { minLength: 6, message: '密码长度不能少于6位' },
      { maxLength: 20, message: '密码长度不能超过20位' }
    ]
  }
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  teacherId.value = ''
  teacherName.value = ''
}

// Base64编码函数
const encodeBase64 = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false

    // 对密码进行base64编码
    const encodedPassword = encodeBase64(form.password)
    
    await setTeacherPassword({
      teacherId: parseInt(teacherId.value),
      password: encodedPassword
    })
    
    Message.success('密码设置成功')
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 打开设置密码对话框
const onOpen = async (id: string, name: string) => {
  reset()
  teacherId.value = id
  teacherName.value = name
  form.teacherName = name
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="less">
</style>
