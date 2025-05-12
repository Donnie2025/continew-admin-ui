<template>
  <a-drawer v-model:visible="visible" title="会员详情" :width="Math.floor(width * 0.8)" :footer="false">
    <template #title>
      <div class="drawer-title-bar">
        <span>会员详情</span>
      </div>
    </template>
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

    <!-- 会员卡列表 -->
    <div class="card-list-section">
      <div class="card-list-title">持有会员卡</div>
      <a-table
        :data="cardList"
        :pagination="false"
        size="small"
        :bordered="false"
        class="card-table"
      >
        <a-table-column title="卡名称" data-index="cardName" />
        <a-table-column title="卡类型" data-index="cardType">
          <template #cell="{ record }">
            {{ getCardTypeName(record.cardType) }}
          </template>
        </a-table-column>
        <a-table-column title="余额" data-index="balance" />
        <a-table-column title="到期时间" data-index="expireDate" />
        <a-table-column title="激活/停用" data-index="cardStatus">
          <template #cell="{ record }">
            <a-switch v-model="record.cardStatus" :checked-value="1" :unchecked-value="0" disabled />
          </template>
        </a-table-column>
        <a-table-column title="操作">
          <template #cell="{ record }">
            <a-space>
              <a-button type="primary" size="mini">充值</a-button>
              <a-button size="mini">扣费</a-button>
              <a-button size="mini">操作记录</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </div>

    <!-- 消费记录Tab -->
    <div class="transaction-section">
      <a-tabs v-model:active-key="activeTab" type="line">
        <a-tab-pane key="all" title="全部" />
        <a-tab-pane key="book_debit" title="约课扣费" />
        <a-tab-pane key="cancel" title="取消约课" />
        <a-tab-pane key="credit" title="充值" />
        <a-tab-pane key="debit" title="扣费" />
        <a-tab-pane key="bind" title="首次绑卡" />
        <a-tab-pane key="other" title="其他" />
      </a-tabs>
      <a-table
        :data="filteredTransactions"
        :pagination="pagination"
        size="small"
        class="transaction-table"
      >
        <a-table-column title="会员卡" data-index="cardName" />
        <a-table-column title="操作时间" data-index="createTime" />
        <a-table-column title="操作类型" data-index="type" />
        <a-table-column title="余额变化" :cell="balanceChangeCell" />
        <a-table-column title="有效期变化" :cell="daysChangeCell" />
        <a-table-column title="实收金额" data-index="creditAmount" />
        <a-table-column title="操作人" data-index="operatorName" />
        <a-table-column title="备注" data-index="remark" />
        <a-table-column title="状态" :cell="statusCell" />
      </a-table>
    </div>
  </a-drawer>

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
            {{ card.name }}
          </a-option>
        </a-select>
      </a-form-item>
      
      <a-form-item label="卡类型">
        <a-input v-model="bindCardForm.cardTypeDisplay" placeholder="卡类型" disabled />
      </a-form-item>
      <a-form-item label="充值次数">
        <a-input-number
          v-model="bindCardForm.balance"
          placeholder="请输入充值次数"
          :min="0"
          style="width: 100%"
        />
      </a-form-item>
      
      <a-form-item v-if="!isUnlimitedCard" label="有效天数">
        <a-input-number
          v-model="bindCardForm.validDays"
          placeholder="请输入有效天数"
          :min="0"
          :precision="0"
          style="width: 100%"
        />
      </a-form-item>
      
      <a-form-item label="实收金额">
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
import { listStuCard, addStuCard } from '@/apis/education/stuCard'
import { listTransaction } from '@/apis/education/transaction'
import { listActiveCards } from '@/apis/education/card'
import { useDict } from '@/hooks/app'

const { width } = useWindowSize()
const visible = ref(false)
const dataId = ref('')
const dataDetail = ref<any>({})
const cardList = ref<any[]>([])
const transactionList = ref<any[]>([])
const activeTab = ref('all')
const pagination = ref({ pageSize: 10, current: 1 })

// 获取卡类型字典
const { card_type } = useDict('card_type')

// 获取卡类型名称
const getCardTypeName = (type: string | number) => {
  if (!type) return '-'
  const typeValue = String(type)
  const typeItem = card_type.value?.find(item => item.value === typeValue)
  return typeItem?.label || '未知类型'
}

// 绑卡模态框相关
const showBindCardModal = ref(false)
const bindCardForm = reactive<{
  cardId: string | undefined
  cardType: string | undefined
  cardTypeDisplay: string | undefined
  validDays: string | undefined
  balance: string | undefined
  actualAmount: number | undefined
  remark: string | undefined
  cardList: any[]
}>({
  cardId: undefined,
  cardType: undefined,
  cardTypeDisplay: undefined,
  validDays: undefined,
  balance: undefined,
  actualAmount: undefined,
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
  return transactionList.value.filter(t => t.type === activeTab.value)
})

const balanceChangeCell = ({ record }: any) => {
  const before = Number(record.beforeAmount)
  const after = Number(record.afterAmount)
  const diff = after - before
  if (diff > 0) return `<span style='color:green'>+${diff}次</span>`
  if (diff < 0) return `<span style='color:red'>${diff}次</span>`
  return `<span>0</span>`
}
const daysChangeCell = ({ record }: any) => {
  const days = Number(record.creditDays) - Number(record.debitDays)
  if (days > 0) return `<span style='color:green'>+${days}天</span>`
  if (days < 0) return `<span style='color:red'>${days}天</span>`
  return `<span>0天</span>`
}
const statusCell = ({ record }: any) => {
  return '<span>激活</span>' // 可根据实际业务调整
}

const onImgError = (e: Event) => {
  const target = e.target as HTMLImageElement | null
  if (target) target.style.display = 'none'
}

// 打开绑卡模态框
const onBindCard = async () => {
  showBindCardModal.value = true
  // 加载可用会员卡列表
  try {
    const { data } = await listActiveCards()
    bindCardForm.cardList = data || []
  } catch (error) {
    console.error('获取会员卡列表失败', error)
  }
}

// 是否为无限期卡类型
const isUnlimitedCard = computed(() => {
  if (!bindCardForm.cardType) return false
  const type = typeof bindCardForm.cardType === 'string' ? Number(bindCardForm.cardType) : bindCardForm.cardType
  // 卡类型为2（次卡无限期）或4（储蓄卡无限期）时为无限期
  return type === 2 || type === 4
})

// 会员卡选择改变时自动填充卡类型
const handleCardChange = (value: string) => {
  if (value) {
    const selectedCard = bindCardForm.cardList.find(card => card.id === value)
    if (selectedCard) {
      bindCardForm.cardType = selectedCard.type
      bindCardForm.cardTypeDisplay = getCardTypeName(selectedCard.type)
      // 自动带出有效天数和充值次数
      if (selectedCard.availableDay && !isUnlimitedCard.value) {
        bindCardForm.validDays = selectedCard.availableDay
      } else if (isUnlimitedCard.value) {
        bindCardForm.validDays = undefined
      }
      
      // 设置默认充值次数
      if (selectedCard.availableCount) {
        bindCardForm.balance = selectedCard.availableCount
      } else if (selectedCard.availableBalance) {
        bindCardForm.balance = selectedCard.availableBalance
      }
      
      // 设置默认实收金额
      if (selectedCard.price) {
        bindCardForm.actualAmount = Number(selectedCard.price)
      }
    }
  } else {
    bindCardForm.cardType = undefined
    bindCardForm.cardTypeDisplay = undefined
    bindCardForm.validDays = undefined
    bindCardForm.balance = undefined
    bindCardForm.actualAmount = undefined
    bindCardForm.remark = undefined
  }
}

const handleBindCard = async () => {
  if (!bindCardForm.cardId) {
    Message.warning('请选择会员卡')
    return
  }
  if (!isUnlimitedCard.value && !bindCardForm.validDays) {
    Message.warning('请输入有效天数')
    return
  }
  if (!bindCardForm.balance) {
    Message.warning('请输入充值次数')
    return
  }
  
  // 绑定会员卡的逻辑
  bindCardLoading.value = true
  try {
    const params = {
      stuId: dataId.value,
      stuName: dataDetail.value.name,
      cardId: bindCardForm.cardId,
      cardName: bindCardForm.cardList.find(card => card.id === bindCardForm.cardId)?.name,
      cardType: bindCardForm.cardType,
      balance: bindCardForm.balance, // 充值次数
      expireDate: isUnlimitedCard.value ? null : new Date(Date.now() + Number(bindCardForm.validDays) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      cardStatus: 1, // 默认启用
      actualAmount: bindCardForm.actualAmount, // 实收金额
      remark: bindCardForm.remark // 备注
    }
    
    await addStuCard(params)
    Message.success('绑定会员卡成功')
    showBindCardModal.value = false
    // 刷新会员卡列表
    await getCardList()
  } catch (error) {
    console.error('绑定会员卡失败', error)
    Message.error('绑定会员卡失败')
  } finally {
    bindCardLoading.value = false
  }
}

// 取消绑卡
const cancelBindCard = () => {
  showBindCardModal.value = false
  // 重置表单
  bindCardForm.cardId = undefined
  bindCardForm.cardType = undefined
  bindCardForm.cardTypeDisplay = undefined
  bindCardForm.validDays = undefined
  bindCardForm.balance = undefined
  bindCardForm.actualAmount = undefined
  bindCardForm.remark = undefined
}

// 编辑信息
const onEditInfo = () => {
  // TODO: 打开编辑信息弹窗
  // 可根据实际业务实现
}

// 查询详情
const getDataDetail = async () => {
  const { data } = await getStudent(dataId.value)
  dataDetail.value = data
}

// 查询会员卡列表
const getCardList = async () => {
  const { data } = await listStuCard({
    stuId: dataId.value,
    sort: ['id,desc'],
    page: 1,
    size: 99
  } as any)
  cardList.value = (data as any)?.records || []
}

// 查询交易记录
const getTransactionList = async () => {
  const { data } = await listTransaction({
    stuId: dataId.value,
    cardId: undefined,
    type: undefined,
    sort: ['id,desc'],
    page: 1,
    size: 99
  } as any)
  transactionList.value = (data as any)?.records || []
}

// 实际开发中，你可能需要一个API来获取可用卡列表
const fetchAvailableCards = async () => {
  try {
    // const res = await listAvailableCards()
    // availableCards.value = res.data || []
  } catch (error) {
    console.error('获取可用会员卡失败:', error)
  }
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await getDataDetail()
  await getCardList()
  await getTransactionList()
  await fetchAvailableCards() // 获取可用会员卡
  visible.value = true
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
}
.card-list-title {
  font-weight: 600;
  margin-bottom: 8px;
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
