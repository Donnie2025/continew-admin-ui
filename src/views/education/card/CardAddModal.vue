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
import { getCard, createCard, updateCard } from '@/apis/education/card'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import { ref, nextTick, onMounted, watch } from 'vue'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改会员卡管理' : '新增会员卡管理'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { yes_no, card_type } = useDict('yes_no', 'card_type')

type FormType = {
  name: string;
  type: string;
  availableCount: string;
  availableDay: string;
  availableBalance: string;
  price: string;
  isAgentOnly: boolean | string;
  isOnlineSale: boolean | string;
  isRenewable: boolean | string;
  renewTimes: string;
  renewDays: string;
  renewPrice: string;
}

const [form, resetForm] = useResetReactive<FormType>({
  name: '',
  type: '',
  availableCount: '',
  availableDay: '',
  availableBalance: '',
  price: '',
  isAgentOnly: false as boolean | string,
  isOnlineSale: true as boolean | string,
  isRenewable: true as boolean | string,
  renewTimes: '',
  renewDays: '',
  renewPrice: '',
})

watch([yes_no, card_type], ([yesNoVal, cardTypeVal]) => {
  if (yesNoVal?.length && cardTypeVal?.length) {
    const noValue = yesNoVal.find(item => item.label === '否')?.value || false
    const yesValue = yesNoVal.find(item => item.label === '是')?.value || true
    const cardTypeValue = cardTypeVal.find(item => item.label === '次卡无限期')?.value || '次卡无限期'
    
    form.isAgentOnly = noValue
    form.isOnlineSale = yesValue
    form.isRenewable = yesValue
    if (!form.type) form.type = cardTypeValue
  }
}, { immediate: true })

const columns: ColumnItem[] = reactive([
  {
    label: '会员卡名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '会员卡类型',
    field: 'type',
    type: 'select', 
    span: 24,
    required: true,
    props: {
      options: card_type,
    },
  },
  {
    label: '可用次数',
    field: 'availableCount',
    type: 'input',
    span: 24,
  },
  {
    label: '有效天数',
    field: 'availableDay',
    type: 'input',
    span: 24,
  },
  {
    label: '可用余额',
    field: 'availableBalance',
    type: 'input',
    span: 24,
  },
  {
    label: '代理售卖价格',
    field: 'price',
    type: 'input',
    span: 24,
    props: {
      placeholder: '请输入代理售卖价格（可为空）',
      allowClear: true
    }
  },
  {
    label: '是否仅代理可售',
    field: 'isAgentOnly',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: yes_no,
    },
  },
  {
    label: '是否支持线上购卡',
    field: 'isOnlineSale',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: yes_no,
    },
  },
  {
    label: '是否可续费',
    field: 'isRenewable',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: yes_no,
    },
  },
  {
    label: '续费次数',
    field: 'renewTimes',
    type: 'input',
    span: 24,
  },
  {
    label: '续费天数',
    field: 'renewDays',
    type: 'input',
    span: 24,
  },
  {
    label: '续费价格',
    field: 'renewPrice',
    type: 'input',
    span: 24,
  },
])

const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  
  nextTick(() => {
    const noValue = yes_no.value.find(item => item.label === '否')?.value || false
    const yesValue = yes_no.value.find(item => item.label === '是')?.value || true
    const cardTypeValue = card_type.value.find(item => item.label === '次卡无限期')?.value || '次卡无限期'
    
    form.isAgentOnly = noValue
    form.isOnlineSale = yesValue
    form.isRenewable = yesValue
    form.type = cardTypeValue
    form.price = ''
  })
}

const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateCard(dataId.value, form)
      Message.success('修改成功')
    } else {
      await createCard(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

const onAdd = async () => {
  reset()
  dataId.value = ''
  visible.value = true
}

const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const { data } = await getCard(id)
  Object.assign(form, data)
  visible.value = true
}

onMounted(() => {
  nextTick(() => {
    console.log('表单当前值:', form);
  });
});

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
