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
import { getMaterialLesson, addMaterialLesson, updateMaterialLesson } from '@/apis/education/materialLesson'
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
const title = computed(() => (isUpdate.value ? '修改课节' : '新增课节'))
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
  {
    label: '教材ID',
    field: 'materialId',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '教材名称（冗余字段，格式：name + level）',
    field: 'materialName',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '课节名字',
    field: 'lessonName',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '状态（1:启用 0:禁用）',
    field: 'status',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '创建人',
    field: 'createUser',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '创建时间',
    field: 'createTime',
    type: 'input',
    span: 24,
    required: true,
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
      await updateMaterialLesson(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addMaterialLesson(form)
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
  const { data } = await getMaterialLesson(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
