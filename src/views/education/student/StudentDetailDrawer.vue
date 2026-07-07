<template>
  <a-drawer v-model:visible="visible" title="会员详情" :width="Math.floor(width * 0.8)" :footer="false">
    <template #title>
      <div class="drawer-title-bar">
        <span>会员详情</span>
      </div>
    </template>

    <a-spin :loading="loading" style="width: 100%">
      <!-- 顶部：头像与基础信息 -->
      <div class="student-header">
      <div class="student-header-left">
        <img
          v-if="dataDetail?.avatar || dataDetail?.headImg"
          :src="(dataDetail?.avatar || dataDetail?.headImg || '').trim()"
          alt="头像"
          class="student-avatar-img"
          @error="onImgError"
        />
        <div v-else class="student-avatar-placeholder">{{ dataDetail?.name?.[0] }}</div>
        <div class="student-info">
          <div class="student-name">{{ dataDetail?.name }}</div>
          <div class="student-meta">
            <span>手机号：{{ dataDetail?.phone }}</span>
          </div>
          <div class="student-meta">
            <span>备注：{{ dataDetail?.remark || '-' }}</span>
          </div>
        </div>
      </div>
      <div class="student-header-actions">
        <a-button
          size="large"
          class="btn-green"
          @click="onBindCard"
        >绑定会员卡</a-button>
        <a-button
          size="large"
          class="btn-blue"
          style="margin-left: 16px;"
          @click="onEditInfo"
        >编辑信息</a-button>
      </div>
    </div>

    <!-- 会员账户 -->
    <div class="card-list-section">
      <div class="card-list-title">持有会员卡</div>
      <a-table
        v-if="accountList.length > 0"
        :data="accountList"
        :columns="accountColumns"
        :pagination="false"
        :bordered="{ cell: true }"
        size="medium"
        class="account-table"
      >
        <template #accountTypeName="{ record }">
          <a-tag :color="getAccountTypeColor(record.accountType)">
            {{ record.accountTypeName }}
          </a-tag>
        </template>
        <template #balance="{ record }">
          <span class="balance-text">{{ record.balance || 0 }}节</span>
        </template>
        <template #expireDate="{ record }">
          <span v-if="record.expireDate">{{ record.expireDate }}</span>
          <span v-else class="expire-permanent">永久使用</span>
        </template>
        <template #status="{ record }">
          <a-switch :model-value="record.status === 1" disabled />
        </template>
        <template #action="{ record }">
          <a-space>
            <a-button type="primary" size="small" @click="onRecharge(record)">充值</a-button>
            <a-button size="small" @click="onDeduct(record)">扣费</a-button>
            <a-button size="small" @click="onViewRecords(record)">操作记录</a-button>
          </a-space>
        </template>
      </a-table>
      <div v-else class="empty-account">
        <span class="empty-text">暂无账户，购买课包后自动开通</span>
      </div>
    </div>

    <!-- 消费记录Tab -->
    <div class="transaction-section">
      <a-tabs v-model:active-key="activeTab" type="line">
        <a-tab-pane key="all" title="全部" />
        <a-tab-pane key="consume" title="约课扣费" />
        <a-tab-pane key="refund" title="取消约课" />
        <a-tab-pane key="recharge" title="充值" />
        <a-tab-pane key="adjust" title="扣费" />
        <a-tab-pane key="bind" title="首次绑卡" />
        <a-tab-pane key="other" title="其他" />
      </a-tabs>
      <a-table
        :data="filteredTransactions"
        :pagination="pagination"
        :bordered="{ cell: true }"
        size="medium"
        class="transaction-table"
      >
        <a-table-column title="操作时间" data-index="createTime" :width="180" />
        <a-table-column title="操作类型" data-index="type" :width="120">
          <template #cell="{ record }">
            {{ getTransactionTypeName(record.type) }}
          </template>
        </a-table-column>
        <a-table-column title="次数" :width="100" align="center">
          <template #cell="{ record }">
            <span :style="{ color: getAmountColor(record) }">
              {{ getAmountChange(record) }}
            </span>
          </template>
        </a-table-column>
        <a-table-column title="卡到期日" data-index="expireDate" :width="120" />
        <a-table-column title="金额" data-index="actualAmount" :width="100" align="center" />
        <a-table-column title="操作人" data-index="operatorName" :width="120" />
        <a-table-column title="备注" data-index="remark" :min-width="150" />
        <a-table-column title="状态" :width="100" align="center">
          <template #cell="{ record }">
            <a-tag :color="record.disabled ? 'gray' : 'green'">
              {{ record.disabled ? '停用' : '激活' }}
            </a-tag>
          </template>
        </a-table-column>
      </a-table>
    </div>
    </a-spin>
  </a-drawer>

  <!-- 充值/扣费模态框 -->
  <StudentAdjustBalanceModal ref="StudentAdjustBalanceModalRef" @save-success="handleBalanceChanged" />

  <!-- 操作记录抽屉 -->
  <StudentBalanceRecordsDrawer ref="StudentBalanceRecordsDrawerRef" />

  <!-- 绑卡模态框 -->
  <a-modal
    v-model:visible="showBindCardModal"
    title="绑定会员卡"
    :mask-closable="false"
    :width="500"
    @cancel="cancelBindCard"
  >
    <a-form :model="bindCardForm" layout="vertical">
      <a-form-item label="会员卡" required>
        <a-select
          v-model="bindCardForm.cardId"
          placeholder="请选择会员卡"
          allow-clear
          @change="handleCardChange"
        >
          <a-option v-for="card in bindCardForm.cardList" :key="card.id" :value="card.id">
            {{ card.title }} - {{ card.initBalance }}节/{{ card.initDays }}天 - ¥{{ card.price }}
          </a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="充值课时">
        <a-input-number
          v-model="bindCardForm.balance"
          placeholder="课时数（自动从卡模板读取）"
          :min="0"
          disabled
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item label="有效天数">
        <a-input-number
          v-model="bindCardForm.validDays"
          placeholder="有效天数（自动从卡模板读取）"
          :min="0"
          :precision="0"
          disabled
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item label="实收金额" required>
        <div class="amount-input-container">
          <a-input-number
            v-model="bindCardForm.actualAmount"
            placeholder="请输入实收金额"
            :min="0"
            :precision="2"
            class="amount-input"
          />
        </div>
      </a-form-item>

      <a-form-item label="支付渠道">
        <a-select
          v-model="bindCardForm.paymentChannelId"
          placeholder="请选择支付渠道"
          allow-clear
        >
          <a-option v-for="channel in paymentChannels" :key="channel.id" :value="channel.id">
            {{ channel.channelName }}
          </a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="备注">
        <a-textarea
          v-model="bindCardForm.remark"
          placeholder="备注"
          :auto-size="{ minRows: 3, maxRows: 5 }"
        />
      </a-form-item>
      
    </a-form>
    
    <template #footer>
      <a-button @click="cancelBindCard">取消</a-button>
      <a-button type="primary" @click="handleBindCard" :loading="bindCardLoading">确定</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { ref, computed, reactive } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getStudent } from '@/apis/education/student'
import { getAvailableCards } from '@/apis/education/card'
import { listTransaction } from '@/apis/education/transaction'
import { createOrder, confirmOrder } from '@/apis/education/order'
import { getStudentAccounts } from '@/apis/education/account'
import { listActiveChannels } from '@/apis/education/paymentChannel'
import { useDict } from '@/hooks/app'
import StudentAdjustBalanceModal from './StudentAdjustBalanceModal.vue'
import StudentBalanceRecordsDrawer from './StudentBalanceRecordsDrawer.vue'

const { width } = useWindowSize()
const visible = ref(false)
const dataId = ref('')
const dataDetail = ref<any>({})
const accountList = ref<any[]>([])
const transactionList = ref<any[]>([])
const activeTab = ref('all')
const pagination = ref({ pageSize: 10, current: 1 })
const loading = ref(false)

const accountColumns = [
  {
    title: '账户类型',
    dataIndex: 'accountTypeName',
    width: 150,
    slotName: 'accountTypeName',
  },
  {
    title: '余额',
    dataIndex: 'balance',
    width: 120,
    slotName: 'balance',
  },
  {
    title: '到期时间',
    dataIndex: 'expireDate',
    width: 150,
    slotName: 'expireDate',
  },
  {
    title: '激活/停用',
    dataIndex: 'status',
    width: 120,
    align: 'center',
    slotName: 'status',
  },
  {
    title: '操作',
    width: 280,
    align: 'center',
    slotName: 'action',
  },
]

// 获取卡类型字典
const { card_type } = useDict('card_type')

// 获取卡类型名称
const getCardTypeName = (type: string | number) => {
  if (!type) return '-'
  const typeValue = String(type)
  const typeItem = card_type.value?.find(item => item.value === typeValue)
  return typeItem?.label || '未知类型'
}

// 获取账户类型颜色
const getAccountTypeColor = (accountType: string) => {
  const colorMap: Record<string, string> = {
    'PAID': 'blue',
    'GIFT': 'orange',
    'LEAVE': 'purple',
    'FREEZE': 'gray'
  }
  return colorMap[accountType] || 'blue'
}

// 绑卡模态框相关
const showBindCardModal = ref(false)
const paymentChannels = ref<any[]>([])
const bindCardForm = reactive<{
  cardId: string | undefined
  validDays: number | undefined
  balance: number | undefined
  actualAmount: number | undefined
  paymentChannelId: string | undefined
  remark: string | undefined
  cardList: any[]
}>({
  cardId: undefined,
  validDays: undefined,
  balance: undefined,
  actualAmount: undefined,
  paymentChannelId: undefined,
  remark: undefined,
  cardList: []
})

const bindCardLoading = ref(false)

const genderText = (g: number | string) => {
  if (g === 1 || g === '1') return '男'
  if (g === 2 || g === '2') return '女'
  return '未知'
}

const filteredTransactions = computed(() => {
  if (activeTab.value === 'all') return transactionList.value
  if (activeTab.value === 'other') {
    return transactionList.value.filter(t =>
      !['consume', 'refund', 'recharge', 'adjust', 'bind'].includes(t.type)
    )
  }
  return transactionList.value.filter(t => t.type === activeTab.value)
})

// 获取交易类型名称
const getTransactionTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'consume': '约课扣费',
    'refund': '取消约课退款',
    'recharge': '充值',
    'adjust': '扣费',
    'bind': '首次绑卡',
    'debit': '扣费',
    'credit': '充值',
    'freeze': '冻结',
    'activate': '激活',
    'cancel': '取消约课',
    'book_debit': '约课扣费'
  }
  return typeMap[type] || type
}

// 获取次数变化
const getAmountChange = (record: any) => {
  const debit = Number(record.debitAmount || 0)
  const credit = Number(record.creditAmount || 0)
  if (credit > 0) {
    return `+${credit}`
  } else if (debit > 0) {
    return `-${debit}`
  }
  return '0'
}

// 获取金额颜色
const getAmountColor = (record: any) => {
  const debit = Number(record.debitAmount || 0)
  const credit = Number(record.creditAmount || 0)
  if (credit > 0) return 'green'
  if (debit > 0) return 'red'
  return ''
}

const amountChangeCell = ({ record }: any) => {
  const amount = Number(record.amount || 0)
  const direction = record.direction
  if (direction === 'C') {
    return `<span style='color:green'>+${amount}</span>`
  } else if (direction === 'D') {
    return `<span style='color:red'>-${amount}</span>`
  }
  return `<span>0</span>`
}

const onImgError = (e: Event) => {
  const target = e.target as HTMLImageElement | null
  if (target) target.style.display = 'none'
}

// 打开绑卡模态框
const onBindCard = async () => {
  showBindCardModal.value = true
  // 加载可用会员卡列表和支付渠道
  try {
    const [cardsRes, channelsRes] = await Promise.all([
      getAvailableCards(),
      listActiveChannels()
    ])
    bindCardForm.cardList = cardsRes.data || []
    paymentChannels.value = channelsRes.data || []
  } catch (error) {
    console.error('获取会员卡列表或支付渠道失败', error)
  }
}

// 是否为无限期卡类型
const isUnlimitedCard = computed(() => {
  return false // 新系统不再区分卡类型，统一使用账户
})

// 会员卡选择改变时自动填充卡类型
const handleCardChange = (value: string) => {
  if (value) {
    const selectedCard = bindCardForm.cardList.find(card => card.id === value)
    if (selectedCard) {
      // 自动填充卡的配置信息
      bindCardForm.balance = selectedCard.initBalance || 0
      bindCardForm.validDays = selectedCard.initDays || 0
      bindCardForm.actualAmount = Number(selectedCard.price) || 0
    }
  } else {
    bindCardForm.validDays = undefined
    bindCardForm.balance = undefined
    bindCardForm.actualAmount = undefined
  }
}

const handleBindCard = async () => {
  if (!bindCardForm.cardId) {
    Message.warning('请选择会员卡')
    return
  }
  if (!bindCardForm.actualAmount || bindCardForm.actualAmount <= 0) {
    Message.warning('请输入实收金额')
    return
  }

  bindCardLoading.value = true
  try {
    const selectedCard = bindCardForm.cardList.find(card => card.id === bindCardForm.cardId)
    if (!selectedCard) {
      Message.error('选择的会员卡不存在')
      bindCardLoading.value = false
      return
    }

    // 1. 创建订单
    const orderParams = {
      studentId: dataId.value,
      cardId: bindCardForm.cardId,
      paymentChannelId: bindCardForm.paymentChannelId,
      paymentType: bindCardForm.paymentChannelId ? undefined : 'OFFLINE' // 如果没选支付渠道，默认线下支付
    }

    const orderRes = await createOrder(orderParams)
    if (!orderRes.data || !orderRes.data.id) {
      Message.error('创建订单失败')
      bindCardLoading.value = false
      return
    }

    // 2. 确认订单（激活账户并充值）
    await confirmOrder(orderRes.data.id)

    Message.success('充值成功')
    showBindCardModal.value = false

    // 刷新账户信息和交易记录
    await getAccountInfo()
    await getTransactionList()
  } catch (error) {
    console.error('充值失败', error)
    Message.error('充值失败：' + (error.message || '未知错误'))
  } finally {
    bindCardLoading.value = false
  }
}

// 取消绑卡
const cancelBindCard = () => {
  showBindCardModal.value = false
  // 重置表单
  bindCardForm.cardId = undefined
  bindCardForm.validDays = undefined
  bindCardForm.balance = undefined
  bindCardForm.actualAmount = undefined
  bindCardForm.paymentChannelId = undefined
  bindCardForm.remark = undefined
}

// 编辑信息
const onEditInfo = () => {
  // TODO: 打开编辑信息弹窗
  // 可根据实际业务实现
}

// 查询详情
const getDataDetail = async () => {
  try {
    const { data } = await getStudent(dataId.value)
    dataDetail.value = data
  } catch (error) {
    console.error('获取学生详情失败', error)
    Message.error('获取学生详情失败，请稍后重试')
  }
}

// 查询账户信息
const getAccountInfo = async () => {
  const stuId = Number(dataId.value)
  if (!stuId) {
    accountList.value = []
    return
  }
  try {
    const { data } = await getStudentAccounts(stuId)
    accountList.value = data || []
  } catch (error) {
    console.error('获取账户信息失败', error)
    accountList.value = []
  }
}

// 查询交易记录
const getTransactionList = async () => {
  try {
    const { data } = await listTransaction({
      studentId: dataId.value,
      cardId: undefined,
      type: undefined,
      sort: ['id,desc'],
      page: 1,
      size: 20
    } as any)
    transactionList.value = (data as any)?.records || []
  } catch (error) {
    console.error('获取交易记录失败', error)
    transactionList.value = []
  }
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  visible.value = true
  loading.value = true

  try {
    // 并行加载三个请求
    await Promise.all([
      getDataDetail(),
      getAccountInfo(),
      getTransactionList()
    ])
  } catch (error) {
    console.error('加载详情数据失败', error)
  } finally {
    loading.value = false
  }
}

// 充值
const StudentAdjustBalanceModalRef = ref<InstanceType<typeof StudentAdjustBalanceModal>>()
const onRecharge = (record: any) => {
  StudentAdjustBalanceModalRef.value?.onOpen(dataId.value, dataDetail.value?.name, record.balance || 0, 'RECHARGE')
}

// 扣费
const onDeduct = (record: any) => {
  StudentAdjustBalanceModalRef.value?.onOpen(dataId.value, dataDetail.value?.name, record.balance || 0, 'DEDUCT')
}

// 查看操作记录
const StudentBalanceRecordsDrawerRef = ref<InstanceType<typeof StudentBalanceRecordsDrawer>>()
const onViewRecords = (record: any) => {
  StudentBalanceRecordsDrawerRef.value?.onOpen(dataId.value, dataDetail.value?.name)
}

// 充值/扣费成功后刷新数据
const handleBalanceChanged = async () => {
  await getAccountInfo()
  await getTransactionList()
}

defineExpose({ onOpen })
</script>

<style scoped>
.student-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}
.student-header-left {
  display: flex;
  align-items: center;
}
.student-avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 24px;
  background: #f5f5f7;
  border: 1px solid #e5e6eb;
}
.student-avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f5f5f7;
  color: #bcbcbc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 600;
  margin-right: 24px;
  border: 1px solid #e5e6eb;
}
.student-info {
  flex: 1;
}
.student-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}
.student-meta {
  color: #888;
  margin-bottom: 4px;
}
.student-header-actions {
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.btn-green {
  background: #5ac37b !important;
  color: #fff !important;
  border: none !important;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  padding: 10px 24px;
}
.btn-blue {
  background: #409eff !important;
  color: #fff !important;
  border: none !important;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  padding: 10px 24px;
}
.card-list-section {
  margin-bottom: 24px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}
.card-list-title {
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 16px;
}
.account-table {
  border-radius: 8px;
  overflow: hidden;
}
.account-table :deep(.arco-table-th) {
  background-color: #f7f8fa;
  font-weight: 600;
}
.balance-text {
  font-weight: 600;
  color: #165dff;
  font-size: 15px;
}
.expire-permanent {
  color: #00b42a;
  font-weight: 500;
}
.empty-account {
  padding: 40px 0;
  text-align: center;
  background: #f7f8fa;
  border-radius: 8px;
}
.empty-text {
  font-size: 14px;
  color: #999;
}
.transaction-section {
  margin-top: 24px;
}
.drawer-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.drawer-title-actions {
  display: flex;
  align-items: center;
}
</style>
