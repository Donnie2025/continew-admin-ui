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
import { getTransaction, addTransaction, updateTransaction } from '@/apis/education/transaction'
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
const title = computed(() => (isUpdate.value ? '修改订单' : '新增订单'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { transaction_type } = useDict('transaction_type')

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
  {
    label: '学生会员卡绑定表ID',
    field: 'stuCardId',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '学生ID',
    field: 'stuId',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '会员卡ID',
    field: 'cardId',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '变动类型',
    field: 'type',
    type: 'select', 
    span: 24,
    required: true,
    props: {
      options: transaction_type,
    },
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
      await updateTransaction(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addTransaction(form)
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
  const { data } = await getTransaction(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
