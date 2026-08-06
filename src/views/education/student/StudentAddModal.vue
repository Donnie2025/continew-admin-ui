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
import { ref, computed, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getStudent, addStudent, updateStudent } from '@/apis/education/student'
import { type AgentOption, listAgentOptions } from '@/apis/education/agent'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改学生' : '新增学生'))
const formRef = ref<InstanceType<typeof GiForm>>()
const agentOptions = ref<AgentOption[]>([])
listAgentOptions().then(res => { agentOptions.value = res.data })

const [form, resetForm] = useResetReactive({
  name: undefined,
  agentCode: undefined,
  phone: undefined,
  password: undefined,
  remark: undefined,
})

const columns: ColumnItem[] = reactive([
  {
    label: '学生姓名',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '手机号码',
    field: 'phone',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '代理商',
    field: 'agentCode',
    type: 'select',
    span: 24,
    props: {
      options: agentOptions,
      fieldNames: { value: 'code', label: 'name' },
      allowClear: true,
      allowSearch: true,
    },
  },
  {
    label: '密码',
    field: 'password',
    type: 'input',
    props: {
      type: 'password',
      showPassword: true,
    },
    span: 24,
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
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
      await updateStudent(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addStudent(form)
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
  try {
    const { data } = await getStudent(id)
    Object.assign(form, data)
    visible.value = true
  } catch (error) {
    console.error('获取学生信息失败', error)
    Message.error('获取学生信息失败，请稍后重试')
  }
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="less">
</style>

