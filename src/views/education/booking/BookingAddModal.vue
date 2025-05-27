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
import { getBooking, addBooking, updateBooking } from '@/apis/education/booking'
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
const title = computed(() => (isUpdate.value ? '修改预约' : '新增预约'))
const formRef = ref<InstanceType<typeof GiForm>>()

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
  {
    label: '',
    field: 'startDate',
    type: 'input',
    span: 24,
  },
  {
    label: '',
    field: 'startTime',
    type: 'input',
    span: 24,
  },
  {
    label: '所属学生姓名',
    field: 'studentName',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '预约会员卡名称',
    field: 'cardName',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '预约教材名字',
    field: 'materialName',
    type: 'input',
    span: 24,
  },
  {
    label: '预约备注',
    field: 'remark',
    type: 'input',
    span: 24,
  },
  {
    label: '创建人',
    field: 'createUser',
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
      await updateBooking(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addBooking(form)
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
  const { data } = await getBooking(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
