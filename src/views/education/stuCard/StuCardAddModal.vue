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
import { getStuCard, addStuCard, updateStuCard } from '@/apis/education/stuCard'
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
const title = computed(() => (isUpdate.value ? '修改会员绑卡' : '新增会员绑卡'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { yes_no,card_type } = useDict('yes_no','card_type')

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
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
    label: '会员卡类型（1：次卡有限期；2：次卡无限期；3：储蓄卡有限期；4：储蓄卡无限期）',
    field: 'cardType',
    type: 'select', 
    span: 24,
    required: true,
    props: {
      options: card_type,
    },
  },
  {
    label: '卡状态（1：启用，学生端可见；0：禁用，学生端不可见，后台管理系统可见）',
    field: 'cardStatus',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: yes_no,
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
      await updateStuCard(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addStuCard(form)
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
  const { data } = await getStuCard(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
