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
  title: string;
  subTitle: string;
  description: string;
  type: string;
  initTimes: number | string;
  initDays: number | string;
  initBalance: string;
  price: string;
  sort: number | string;
  institutionId: string;
  remark: string;
}

const [form, resetForm] = useResetReactive<FormType>({
  title: '',
  subTitle: '',
  description: '',
  type: '',
  initTimes: '',
  initDays: '',
  initBalance: '',
  price: '',
  sort: 999,
  institutionId: '',
  remark: '',
})

watch([card_type], ([cardTypeVal]) => {
  if (cardTypeVal?.length) {
    const cardTypeValue = cardTypeVal.find(item => item.label === '次卡无限期')?.value || 'TU'
    if (!form.type) form.type = cardTypeValue
  }
}, { immediate: true })

const columns: ColumnItem[] = reactive([
  {
    label: '会员卡标题',
    field: 'title',
    type: 'input',
    span: 24,
    required: true,
    props: {
      placeholder: '请输入会员卡标题',
      maxLength: 100
    }
  },
  {
    label: '副标题',
    field: 'subTitle',
    type: 'input',
    span: 24,
    props: {
      placeholder: '请输入副标题（可为空）',
      maxLength: 200
    }
  },
  {
    label: '会员卡描述',
    field: 'description',
    type: 'textarea',
    span: 24,
    props: {
      placeholder: '请输入会员卡描述（可为空）',
      maxLength: 500,
      rows: 3
    }
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
    label: '初始次数',
    field: 'initTimes',
    type: 'input-number',
    span: 12,
    props: {
      placeholder: '请输入初始次数',
      min: 0
    }
  },
  {
    label: '初始天数',
    field: 'initDays',
    type: 'input-number',
    span: 12,
    props: {
      placeholder: '请输入初始有效天数',
      min: 0
    }
  },
  {
    label: '初始余额',
    field: 'initBalance',
    type: 'input-number',
    span: 12,
    props: {
      placeholder: '请输入初始余额',
      min: 0,
      precision: 2
    }
  },
  {
    label: '售卖价格',
    field: 'price',
    type: 'input-number',
    span: 12,
    props: {
      placeholder: '请输入售卖价格',
      min: 0,
      precision: 2
    }
  },
  {
    label: '排序',
    field: 'sort',
    type: 'input-number',
    span: 12,
    props: {
      placeholder: '请输入排序值（越小越靠前）',
      min: 0
    }
  },
  {
    label: '所属机构ID',
    field: 'institutionId',
    type: 'input',
    span: 12,
    props: {
      placeholder: '请输入所属机构ID（可为空）'
    }
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: {
      placeholder: '请输入备注信息（可为空）',
      maxLength: 500,
      rows: 2
    }
  }
])

const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  
  nextTick(() => {
    const cardTypeValue = card_type.value.find(item => item.label === '次卡无限期')?.value || 'TU'
    form.type = cardTypeValue
    form.sort = 999
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
