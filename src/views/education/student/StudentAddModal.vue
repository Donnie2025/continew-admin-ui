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
import { getStudent, addStudent, updateStudent } from '@/apis/education/student'
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
const title = computed(() => (isUpdate.value ? '修改学生管理' : '新增学生管理'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { sex_type } = useDict('sex_type')

const [form, resetForm] = useResetReactive({
  // todo 待补充
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
    label: '性别',
    field: 'gender',
    type: 'select', 
    span: 24,
    props: {
      options: sex_type,
    },
  },
  {
    label: '手机号码',
    field: 'phone',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '邮箱',
    field: 'email',
    type: 'input',
    span: 24,
  },
  {
    label: '所属代理的ID',
    field: 'agentId',
    type: 'input',
    span: 24,
  },
  {
    label: '头像地址',
    field: 'headImg',
    type: 'input',
    span: 24,
  },
  {
    label: '密码',
    field: 'password',
    type: 'input',
    span: 24,
  },
  {
    label: '备注',
    field: 'remark',
    type: 'input',
    span: 24,
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
  const { data } = await getStudent(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
