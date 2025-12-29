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
import { getMaterial, addMaterial, updateMaterial } from '@/apis/education/material'
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
const title = computed(() => (isUpdate.value ? '修改教材' : '新增教材'))
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
  {
    label: '教材编码',
    field: 'code',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '教材名字',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '级别（K1:幼儿园小班 K2:幼儿园中班 K3:幼儿园大班 G1-G12:1-12年级 ADULT:成人）',
    field: 'level',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '分类（CHILDREN:少儿启蒙 TEENAGER:青少年 ADULT:成人教材 COMPREHENSIVE:综合教材 READING:阅读绘本 PHONICS:自然拼读 EXAM:考试教材 GRAMMAR:语法）',
    field: 'category',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '是否前端展示（1:展示 0:不展示）',
    field: 'isShow',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '排序',
    field: 'sort',
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
      await updateMaterial(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addMaterial(form)
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
  const { data } = await getMaterial(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
