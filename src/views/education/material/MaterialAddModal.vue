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
  code: '',
  name: '',
  level: '',
  category: '',
  coverImg: '',
  description: '',
  isShow: true, // 默认展示
  sort: 999 // 默认排序
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
    label: '级别',
    field: 'level',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '分类',
    field: 'category',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '封面图片',
    field: 'coverImg',
    type: 'input',
    span: 24,
    required: false,
  },
  {
    label: '教材描述',
    field: 'description',
    type: 'textarea',
    span: 24,
    required: false,
  },
  {
    label: '前端展示',
    field: 'isShow',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: [
        { label: '展示', value: true },
        { label: '不展示', value: false }
      ]
    }
  },
  {
    label: '排序',
    field: 'sort',
    type: 'input-number',
    span: 24,
    required: true,
    props: {
      min: 0,
      max: 9999,
      placeholder: '请输入排序值，数字越小越靠前'
    }
  }
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
