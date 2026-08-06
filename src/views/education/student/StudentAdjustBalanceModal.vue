<template>
  <a-modal
    v-model:visible="visible"
    :title="modalTitle"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 500 ? 500 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { adjustStudentBalance } from '@/apis/education/student'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const studentId = ref('')
const studentName = ref('')
const currentBalance = ref(0)
const operationType = ref<'RECHARGE' | 'DEDUCT'>('RECHARGE')
const visible = ref(false)
const formRef = ref<InstanceType<typeof GiForm>>()

const modalTitle = computed(() => {
  return operationType.value === 'RECHARGE' ? '充值' : '扣费'
})

const [form, resetForm] = useResetReactive({
  studentName: '',
  currentBalance: 0,
  amount: undefined,
  cashAmount: undefined,
  remark: ''
})

const columns: ColumnItem[] = reactive([
  {
    label: '学生姓名',
    field: 'studentName',
    type: 'input',
    span: 24,
    props: {
      disabled: true,
      placeholder: '学生姓名'
    },
    rules: false
  },
  {
    label: '当前余额',
    field: 'currentBalance',
    type: 'input-number',
    span: 24,
    props: {
      disabled: true,
      precision: 0,
      placeholder: '当前余额'
    },
    rules: false
  },
  {
    label: computed(() => operationType.value === 'RECHARGE' ? '充值次数' : '扣费次数'),
    field: 'amount',
    type: 'input-number',
    span: 24,
    required: true,
    props: {
      min: 1,
      max: 999999,
      precision: 0,
      placeholder: computed(() => operationType.value === 'RECHARGE' ? '请输入充值次数' : '请输入扣费次数'),
      suffix: '节'
    },
    rules: [
      { required: true, message: computed(() => operationType.value === 'RECHARGE' ? '请输入充值次数' : '请输入扣费次数') },
      {
        validator: (value: any, callback: any) => {
          if (value !== undefined && value !== null) {
            if (value <= 0) {
              callback('次数必须大于0')
            } else if (operationType.value === 'DEDUCT' && value > currentBalance.value) {
              callback('扣费次数不能大于当前余额')
            } else {
              callback()
            }
          } else {
            callback()
          }
        }
      }
    ]
  },
  {
    label: computed(() => operationType.value === 'RECHARGE' ? '充值金额' : '扣费金额'),
    field: 'cashAmount',
    type: 'input-number',
    span: 24,
    required: operationType.value === 'RECHARGE',
    props: {
      min: 0,
      max: 999999,
      precision: 2,
      placeholder: computed(() => operationType.value === 'RECHARGE' ? '请输入充值金额' : '请输入扣费金额'),
      suffix: '元'
    },
    rules: [
      {
        required: computed(() => operationType.value === 'RECHARGE'),
        message: computed(() => operationType.value === 'RECHARGE' ? '请输入充值金额' : '请输入扣费金额')
      },
      {
        validator: (value: any, callback: any) => {
          if (operationType.value === 'RECHARGE' && (value === undefined || value === null)) {
            callback('充值时必须输入充值金额')
          } else if (value !== undefined && value !== null && value < 0) {
            callback('金额不能为负数')
          } else {
            callback()
          }
        }
      }
    ]
  },
  {
    label: '备注说明',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: {
      placeholder: '请输入备注说明（可选）',
      maxLength: 200,
      showWordLimit: true,
      autoSize: { minRows: 3, maxRows: 5 }
    },
    rules: false
  }
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  studentId.value = ''
  studentName.value = ''
  currentBalance.value = 0
  operationType.value = 'RECHARGE'
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false

    await adjustStudentBalance({
      studentId: studentId.value,
      amount: form.amount,
      cashAmount: form.cashAmount,
      type: operationType.value === 'RECHARGE' ? 'INCREASE' : 'DECREASE',
      remark: form.remark || undefined
    })

    const action = operationType.value === 'RECHARGE' ? '充值' : '扣费'
    Message.success(`${action}成功`)
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 打开对话框
const onOpen = async (id: string, name: string, balance: number, type: 'RECHARGE' | 'DEDUCT') => {
  reset()
  studentId.value = id
  studentName.value = name
  currentBalance.value = balance
  operationType.value = type
  form.studentName = name
  form.currentBalance = balance
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="less">
</style>
