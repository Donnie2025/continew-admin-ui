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
import { listMaterial, type MaterialResp } from '@/apis/education/material'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'

const props = withDefaults(defineProps<{
  presetMaterialId?: string
}>(), {
  presetMaterialId: undefined
})

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
  materialId: undefined,
  lessonName: ''
})

// 教材列表
const materialList = ref<MaterialResp[]>([])

// 获取教材列表
const getMaterialList = async () => {
  try {
    const { data } = await listMaterial({ 
      page: 1, 
      size: 1000,
      sort: ['sort,asc'] // 按sort字段正向排序
    } as any)
    materialList.value = data.list || []
  } catch (error) {
    console.error('获取教材列表失败:', error)
  }
}

const columns = computed<ColumnItem[]>(() => {
  const cols: ColumnItem[] = []
  if (!props.presetMaterialId) {
    cols.push({
      label: '选择教材',
      field: 'materialId',
      type: 'select',
      span: 24,
      required: true,
      props: {
        placeholder: '请选择教材',
        filterable: true,
        allowSearch: true,
        options: materialList.value.map(item => ({
          label: `${item.name} (${item.level})`,
          value: item.id
        }))
      }
    })
  }
  cols.push({
    label: '课节名字',
    field: 'lessonName',
    type: 'input',
    span: 24,
    required: true,
    props: {
      placeholder: '请输入课节名字'
    }
  })
  return cols
})

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
  if (props.presetMaterialId) {
    form.materialId = props.presetMaterialId
  } else {
    await getMaterialList()
  }
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
