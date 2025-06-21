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
import { getClassinUser, addClassinUser, updateClassinUser } from '@/apis/education/classinUser'
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
const title = computed(() => (isUpdate.value ? '修改Classin用户' : '新增Classin用户'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { user_type } = useDict('user_type')

const [form, resetForm] = useResetReactive({
  id: undefined,
  nickname: '',
  userType: '',
  classinUid: '',
  memberId: undefined,
  password: '',
  telephone: '',
  email: '',
  classinInstitutionId: undefined,
  status: 1,
})

const columns: ColumnItem[] = reactive([
  { label: '昵称', field: 'nickname', type: 'input', span: 24, required: true },
  { label: '成员类型', field: 'userType', type: 'select', span: 24, required: true, props: { options: user_type } },
  { label: 'Classin UID', field: 'classinUid', type: 'input', span: 24 },
  { label: '关联成员ID', field: 'memberId', type: 'input', span: 24 },
  { label: '密码', field: 'password', type: 'input', span: 24 },
  { label: '手机号', field: 'telephone', type: 'input', span: 24 },
  { label: '邮箱', field: 'email', type: 'input', span: 24 },
  { label: '关联Classin机构ID', field: 'classinInstitutionId', type: 'input', span: 24, required: true },
  { label: '状态', field: 'status', type: 'select', span: 24, props: { options: [ { label: '启用', value: 1 }, { label: '禁用', value: 2 } ] } },
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
      await updateClassinUser(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addClassinUser(form)
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
  const { data } = await getClassinUser(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
