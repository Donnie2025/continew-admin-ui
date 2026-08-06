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

    <!-- 主标签页 -->
    <div class="main-tabs-section">
      <a-tabs v-model:active-key="mainTab" type="line" class="main-tabs">
        <a-tab-pane key="transactions" title="消费记录">
          <!-- 消费记录二级标签 -->
          <a-tabs v-model:active-key="transactionTab" type="rounded" class="sub-tabs">
            <a-tab-pane key="all" title="全部" />
            <a-tab-pane key="consume" title="约课扣费" />
            <a-tab-pane key="adjust" title="手动扣费" />
            <a-tab-pane key="cancel" title="取消约课" />
            <a-tab-pane key="recharge_bind" title="充值/首次绑卡" />
            <a-tab-pane key="other" title="其他" />
          </a-tabs>
          <a-table
            :data="filteredTransactions"
            :columns="transactionColumns"
            :pagination="pagination"
            :bordered="{ cell: true }"
            size="medium"
            class="transaction-table"
            @page-change="onTransactionPageChange"
          >
            <template #type="{ record }">
              <span v-if="record.type">{{ getTransactionTypeName(record.type) }}</span>
              <span v-else>-</span>
            </template>
            <template #cardTitle="{ record }">
              <span v-if="record.cardTitle">{{ record.cardTitle }}</span>
              <span v-else>-</span>
            </template>
            <template #amountChange="{ record }">
              <span :style="{ color: getAmountColor(record) }">
                {{ getAmountChange(record) }}
              </span>
            </template>
            <template #actualAmount="{ record }">
              <span v-if="record.actualAmount">¥{{ record.actualAmount }}</span>
              <span v-else>-</span>
            </template>
            <template #operatorName="{ record }">
              <span v-if="record.operatorName">{{ record.operatorName }}</span>
              <span v-else>-</span>
            </template>
            <template #remark="{ record }">
              <span v-if="record.remark">{{ record.remark }}</span>
              <span v-else>-</span>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="bookings" title="预约记录">
          <a-table
            :data="bookingList"
            :columns="bookingColumns"
            :pagination="bookingPagination"
            :bordered="{ cell: true }"
            size="medium"
            class="booking-table"
            @page-change="onBookingPageChange"
          >
            <template #slotDateTime="{ record }">
              <div style="display: flex; align-items: center; gap: 10px; padding: 4px 0;">
                <span
                  :style="{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    backgroundColor: isClassCompleted(record.slotDate, record.slotTime) ? '#f53f3f' : '#00b42a'
                  }"
                ></span>
                <span style="display: flex; gap: 12px;">
                  <span>{{ getWeekDay(record.slotDate) }}</span>
                  <span>{{ formatDate(record.slotDate) }}</span>
                  <span>{{ record.slotTime }}</span>
                </span>
              </div>
            </template>
            <template #materialName="{ record }">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span>{{ getMaterialDisplayName(record.materialId, record.materialName, record.materialLevel) }}</span>
                <a
                  v-if="record.lessonUrl"
                  :href="record.lessonUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="color: #165dff; text-decoration: none; cursor: pointer; font-size: 13px;"
                  @click.stop
                >
                  {{ record.lessonName || '-' }}
                </a>
                <span v-else style="color: #86909c; font-size: 13px;">{{ record.lessonName || '-' }}</span>
              </div>
            </template>
            <template #action="{ record }">
              <a-space>
                <a-button type="text" size="small" @click="onEditBooking(record)">修改</a-button>
                <a-button type="text" status="danger" size="small" @click="onCancelBooking(record)">取消预约</a-button>
              </a-space>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="fixed-bookings" title="固定课记录">
          <a-table
            :data="fixedBookingList"
            :columns="fixedBookingColumns"
            :pagination="fixedBookingPagination"
            :bordered="{ cell: true }"
            size="medium"
            class="fixed-booking-table"
            @page-change="onFixedBookingPageChange"
          >
            <template #weekDay="{ record }">
              <span>{{ getWeekDayText(record.weekDay) }}</span>
            </template>
            <template #action="{ record }">
              <a-button
                v-if="record.status === 1"
                type="text"
                status="danger"
                size="small"
                @click="onCancelFixedBooking(record)"
              >
                取消
              </a-button>
              <span v-else style="color: #999;">已取消</span>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="other" title="其他">
          <a-empty description="暂无其他内容" />
        </a-tab-pane>
      </a-tabs>
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

  <!-- 修改预约模态框 -->
  <a-modal
    v-model:visible="showEditBookingModal"
    title="修改预约"
    :mask-closable="false"
    :width="500"
    @cancel="cancelEditBooking"
  >
    <a-form :model="editBookingForm" layout="vertical">
      <a-form-item label="教材">
        <a-select
          v-model="editBookingForm.materialId"
          placeholder="请选择教材（支持搜索）"
          allow-clear
          allow-search
          @change="handleMaterialChange"
        >
          <a-option v-for="material in materialList" :key="material.id" :value="material.id">
            {{ material.displayName }}
          </a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="课节">
        <a-select
          v-model="editBookingForm.lessonId"
          placeholder="请先选择教材（支持搜索）"
          allow-clear
          allow-search
          :disabled="!editBookingForm.materialId"
          :loading="lessonLoading"
        >
          <a-option v-for="lesson in lessonList" :key="lesson.id" :value="lesson.id">
            {{ lesson.name }}
          </a-option>
        </a-select>
      </a-form-item>

      <a-form-item label="备注">
        <a-textarea
          v-model="editBookingForm.remark"
          placeholder="请输入备注"
          :auto-size="{ minRows: 3, maxRows: 5 }"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="cancelEditBooking">取消</a-button>
      <a-button type="primary" @click="handleEditBooking">确定</a-button>
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
import { listBooking, cancelBookingByTeacher, updateBookingInfo } from '@/apis/education/booking'
import { listBookingRecordsByStudentId, deleteFixedBooking } from '@/apis/education/fixed'
import { listAllMaterials, listLessonsByMaterialId } from '@/apis/education/material'
import { useDict } from '@/hooks/app'
import StudentAdjustBalanceModal from './StudentAdjustBalanceModal.vue'
import StudentBalanceRecordsDrawer from './StudentBalanceRecordsDrawer.vue'

const { width } = useWindowSize()
const visible = ref(false)
const dataId = ref('')
const dataDetail = ref<any>({})
const accountList = ref<any[]>([])
const transactionList = ref<any[]>([])
const mainTab = ref('bookings')
const transactionTab = ref('all')
const pagination = ref({ pageSize: 10, current: 1, total: 0 })
const loading = ref(false)

// 预约记录相关
const bookingList = ref<any[]>([])
const bookingPagination = ref({ pageSize: 10, current: 1, total: 0 })

// 固定课相关
const fixedBookingList = ref<any[]>([])
const fixedBookingListAll = ref<any[]>([]) // 存储所有固定课数据
const fixedBookingPagination = ref({ pageSize: 10, current: 1, total: 0 })

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

const transactionColumns = [
  {
    title: '操作时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '操作类型',
    dataIndex: 'type',
    width: 120,
    slotName: 'type',
  },
  {
    title: '会员卡',
    dataIndex: 'cardTitle',
    width: 150,
    slotName: 'cardTitle',
  },
  {
    title: '余额变化',
    width: 120,
    align: 'center',
    slotName: 'amountChange',
  },
  {
    title: '实收金额',
    dataIndex: 'actualAmount',
    width: 100,
    align: 'center',
    slotName: 'actualAmount',
  },
  {
    title: '操作人',
    dataIndex: 'operatorName',
    width: 120,
    slotName: 'operatorName',
  },
  {
    title: '备注',
    dataIndex: 'remark',
    minWidth: 150,
    slotName: 'remark',
  },
]

const bookingColumns = [
  {
    title: '预约老师',
    dataIndex: 'teacherName',
    width: 100,
  },
  {
    title: '上课时间',
    dataIndex: 'slotDateTime',
    width: 200,
    slotName: 'slotDateTime',
  },
  {
    title: '教材/课节',
    dataIndex: 'materialName',
    width: 250,
    slotName: 'materialName',
  },
  {
    title: '备注',
    dataIndex: 'remark',
    width: 100,
  },
  {
    title: '操作',
    width: 80,
    align: 'center',
    slotName: 'action',
  },
]

const fixedBookingColumns = [
  {
    title: '教师',
    dataIndex: 'teacherName',
    width: 120,
  },
  {
    title: '星期',
    dataIndex: 'weekDay',
    width: 100,
    slotName: 'weekDay',
  },
  {
    title: '时间',
    dataIndex: 'startTime',
    width: 120,
  },
  {
    title: '操作人',
    dataIndex: 'createUserString',
    width: 120,
  },
  {
    title: '操作时间',
    dataIndex: 'createTime',
    width: 180,
  },
  {
    title: '操作',
    width: 100,
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
  if (transactionTab.value === 'all') return transactionList.value
  if (transactionTab.value === 'recharge_bind') {
    // 充值/首次绑卡：包含 recharge 和 bind 类型
    return transactionList.value.filter(t => ['recharge', 'bind'].includes(t.type))
  }
  if (transactionTab.value === 'other') {
    // 其他：排除已知的主要类型
    return transactionList.value.filter(t =>
      !['consume', 'cancel', 'recharge', 'adjust', 'bind'].includes(t.type)
    )
  }
  return transactionList.value.filter(t => t.type === transactionTab.value)
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
  const direction = record.direction
  const amount = Number(record.amount || 0)

  if (direction === 'C') {
    // Credit - 入账/增加
    return amount > 0 ? `+${amount}` : '0'
  } else if (direction === 'D') {
    // Debit - 出账/减少
    return amount > 0 ? `-${amount}` : '0'
  }
  return '0'
}

// 获取金额颜色
const getAmountColor = (record: any) => {
  const direction = record.direction
  if (direction === 'C') return 'green' // Credit - 增加
  if (direction === 'D') return 'red'   // Debit - 减少
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

// 格式化时间段日期时间
const formatSlotDateTime = (slotDate: string, slotTime: string) => {
  if (!slotDate || !slotTime) return '-'
  // slotDate format: 20260708, slotTime format: 20:30
  const year = slotDate.substring(0, 4)
  const month = slotDate.substring(4, 6)
  const day = slotDate.substring(6, 8)

  // 计算星期几
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[date.getDay()]

  return `${weekDay}  ${year}-${month}-${day}  ${slotTime}`
}

// 获取星期几
const getWeekDay = (slotDate: string) => {
  if (!slotDate) return ''
  const year = parseInt(slotDate.substring(0, 4))
  const month = parseInt(slotDate.substring(4, 6)) - 1
  const day = parseInt(slotDate.substring(6, 8))
  const date = new Date(year, month, day)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekDays[date.getDay()]
}

// 格式化日期
const formatDate = (slotDate: string) => {
  if (!slotDate) return ''
  const year = slotDate.substring(0, 4)
  const month = slotDate.substring(4, 6)
  const day = slotDate.substring(6, 8)
  return `${year}-${month}-${day}`
}

// 判断课程是否已完成
const isClassCompleted = (slotDate: string, slotTime: string) => {
  if (!slotDate || !slotTime) return false
  try {
    // slotDate format: 20260708, slotTime format: 20:30
    const year = parseInt(slotDate.substring(0, 4))
    const month = parseInt(slotDate.substring(4, 6)) - 1
    const day = parseInt(slotDate.substring(6, 8))
    const [hours, minutes] = slotTime.split(':').map(Number)

    const classDateTime = new Date(year, month, day, hours, minutes)
    const now = new Date()

    return classDateTime < now
  } catch (error) {
    console.error('判断课程完成状态失败', error)
    return false
  }
}

// 获取预约状态颜色
const getBookingStatusColor = (status: number) => {
  const colorMap: Record<number, string> = {
    0: 'red',    // 已取消
    1: 'green',  // 已预约
  }
  return colorMap[status] || 'gray'
}

// 获取预约状态文本
const getBookingStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    0: '已取消',
    1: '已预约',
  }
  return textMap[status] || '未知'
}

// 获取星期文本
const getWeekDayText = (weekDay: number) => {
  const weekMap: Record<number, string> = {
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
    7: '周日',
  }
  return weekMap[weekDay] || '-'
}

// 获取教材显示名称（带级别）
const getMaterialDisplayName = (materialId: string, fallbackName: string, materialLevel?: string) => {
  // 如果后端直接返回了 materialLevel，直接拼接显示
  if (materialLevel) {
    return `${fallbackName || ''}-${materialLevel}`
  }

  // 否则从映射中查找
  if (!materialId) return fallbackName || '-'
  const displayName = materialDisplayMap.value.get(materialId)
  return displayName || fallbackName || '-'
}

// 加载教材列表并构建显示映射
const loadMaterialDisplayMap = async () => {
  try {
    const [bookRes, levelRes] = await Promise.all([
      listAllMaterials('BOOK'),
      listAllMaterials('LEVEL')
    ])

    const books = bookRes?.data ? (Array.isArray(bookRes.data) ? bookRes.data : ((bookRes.data as any).list || [])) : []
    const allLevels = levelRes?.data ? (Array.isArray(levelRes.data) ? levelRes.data : ((levelRes.data as any).list || [])) : []

    const displayMap = new Map<string, string>()

    // 构建 BOOK ID 到 BOOK 对象的映射
    const bookMap = new Map<string, any>()
    books.forEach((book: any) => {
      bookMap.set(String(book.id), book)
      // BOOK 本身也添加到映射中
      displayMap.set(String(book.id), book.name)
    })

    // 处理所有 LEVEL，构建完整的显示名称
    allLevels.forEach((level: any) => {
      const book = bookMap.get(String(level.pid))
      if (book) {
        // 格式：【代码】书名-级别名
        const displayName = `【${book.code || ''}】${book.name}-${level.name}`
        displayMap.set(String(level.id), displayName)
      } else {
        // 如果找不到父级 BOOK，只显示 LEVEL 名称
        displayMap.set(String(level.id), level.name)
      }
    })

    materialDisplayMap.value = displayMap
    console.log('教材显示映射构建完成，共', displayMap.size, '条记录')
  } catch (error) {
    console.error('加载教材显示映射失败', error)
  }
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
    pagination.value.current = 1 // 重置到第一页
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
      page: pagination.value.current,
      size: pagination.value.pageSize
    } as any)
    transactionList.value = (data as any)?.list || []
    pagination.value.total = (data as any)?.total || 0
  } catch (error) {
    console.error('获取交易记录失败', error)
    transactionList.value = []
  }
}

// 交易记录分页变化
const onTransactionPageChange = (page: number) => {
  pagination.value.current = page
  getTransactionList()
}

// 查询预约记录
const getBookingList = async () => {
  try {
    const { data } = await listBooking({
      studentId: dataId.value,
      sort: ['slotDate,desc', 'slotTime,desc'],
      page: bookingPagination.value.current,
      size: bookingPagination.value.pageSize
    } as any)
    const list = (data as any)?.list || []
    // 前端再次确保按上课时间倒序排列
    bookingList.value = list.sort((a: any, b: any) => {
      // 先比较日期
      const dateCompare = String(b.slotDate || '').localeCompare(String(a.slotDate || ''))
      if (dateCompare !== 0) return dateCompare
      // 日期相同时比较时间
      return String(b.slotTime || '').localeCompare(String(a.slotTime || ''))
    })
    bookingPagination.value.total = (data as any)?.total || 0
  } catch (error) {
    console.error('获取预约记录失败', error)
    bookingList.value = []
  }
}

// 预约记录分页变化
const onBookingPageChange = (page: number) => {
  bookingPagination.value.current = page
  getBookingList()
}

// 查询固定课记录
const getFixedBookingList = async () => {
  try {
    const { data } = await listBookingRecordsByStudentId(dataId.value)
    fixedBookingListAll.value = data || []
    fixedBookingPagination.value.total = fixedBookingListAll.value.length
    updateFixedBookingDisplayList()
  } catch (error) {
    console.error('获取固定课记录失败', error)
    fixedBookingListAll.value = []
    fixedBookingList.value = []
  }
}

// 更新固定课显示列表（客户端分页）
const updateFixedBookingDisplayList = () => {
  const { current, pageSize } = fixedBookingPagination.value
  const start = (current - 1) * pageSize
  const end = start + pageSize
  fixedBookingList.value = fixedBookingListAll.value.slice(start, end)
}

// 固定课分页变化
const onFixedBookingPageChange = (page: number) => {
  fixedBookingPagination.value.current = page
  updateFixedBookingDisplayList()
}

// 取消固定课预约
const onCancelFixedBooking = async (record: any) => {
  try {
    await deleteFixedBooking(record.id)
    Message.success('取消预约成功')
    fixedBookingPagination.value.current = 1 // 重置到第一页
    await getFixedBookingList()
  } catch (error) {
    console.error('取消预约失败', error)
    Message.error('取消预约失败')
  }
}

// 修改预约记录
const showEditBookingModal = ref(false)
const editBookingForm = reactive<{
  bookingId: string
  materialId: string | undefined
  lessonId: string | undefined
  lessonName: string | undefined
  remark: string | undefined
}>({
  bookingId: '',
  materialId: undefined,
  lessonId: undefined,
  lessonName: undefined,
  remark: undefined
})

// 教材和课节相关
const materialList = ref<any[]>([])
const lessonList = ref<any[]>([])
const lessonLoading = ref(false)
const materialDisplayMap = ref<Map<string, string>>(new Map())

const onEditBooking = async (record: any) => {
  // 先加载教材列表（同时加载 BOOK 和 LEVEL）
  try {
    // 一次性查询所有 BOOK 和 LEVEL 数据
    const [bookRes, levelRes] = await Promise.all([
      listAllMaterials('BOOK'),
      listAllMaterials('LEVEL')
    ])

    const books = bookRes?.data ? (Array.isArray(bookRes.data) ? bookRes.data : ((bookRes.data as any).list || [])) : []
    const allLevels = levelRes?.data ? (Array.isArray(levelRes.data) ? levelRes.data : ((levelRes.data as any).list || [])) : []

    // 组装数据
    const materialWithLevels: any[] = []

    books.forEach((book: any) => {
      // 找到该 BOOK 下的所有 LEVEL（pid 等于 book.id）
      const levels = allLevels.filter((level: any) => String(level.pid) === String(book.id))

      if (levels.length > 0) {
        // 如果有 LEVEL，为每个 LEVEL 创建一个选项，格式：教材名-级别名
        levels.forEach((level: any) => {
          materialWithLevels.push({
            id: level.id,  // 使用 LEVEL 的 ID
            name: level.name,
            displayName: `${book.name}-${level.name}`,  // 组合显示名称
            bookId: book.id,
            bookName: book.name,
            levelName: level.name,
            type: 'LEVEL'
          })
        })
      } else {
        // 如果没有 LEVEL，直接使用 BOOK
        materialWithLevels.push({
          id: book.id,
          name: book.name,
          displayName: book.name,
          bookId: book.id,
          bookName: book.name,
          type: 'BOOK'
        })
      }
    })

    // 按照排序规则：先按sort正向排序，如果sort值一样，再按照名称正向排序
    materialList.value = materialWithLevels.sort((a: any, b: any) => {
      const sortA = a.sort ?? Infinity
      const sortB = b.sort ?? Infinity
      if (sortA !== sortB) {
        return sortA - sortB
      }
      // sort相同时，按名称正向排序
      return (a.name || '').localeCompare(b.name || '')
    })
  } catch (error) {
    console.error('获取教材列表失败', error)
  }

  // 如果有教材ID，加载对应的课节列表
  if (record.materialId) {
    await loadLessonsByMaterial(record.materialId)
  }

  // 最后设置表单数据并显示模态框
  editBookingForm.bookingId = record.id
  editBookingForm.materialId = record.materialId
  editBookingForm.lessonId = record.lessonId
  editBookingForm.lessonName = record.lessonName
  editBookingForm.remark = record.remark
  showEditBookingModal.value = true
}

// 教材选择改变时，加载对应的课节列表
const handleMaterialChange = async (materialId: string) => {
  editBookingForm.lessonId = undefined
  lessonList.value = []

  if (materialId) {
    await loadLessonsByMaterial(materialId)
  }
}

// 加载课节列表
const loadLessonsByMaterial = async (materialId: string) => {
  lessonLoading.value = true
  try {
    const { data } = await listLessonsByMaterialId(materialId)
    // 判断数据结构，可能是分页数据或直接数组
    let lessons = []
    if (Array.isArray(data)) {
      lessons = data
    } else if ((data as any)?.list && Array.isArray((data as any).list)) {
      lessons = (data as any).list
    }

    // 按照排序规则：先按sort正向排序，如果sort值一样，再按照名称正向排序
    lessonList.value = lessons.sort((a: any, b: any) => {
      const sortA = a.sort ?? Infinity
      const sortB = b.sort ?? Infinity
      if (sortA !== sortB) {
        return sortA - sortB
      }
      // sort相同时，按名称正向排序
      return (a.name || '').localeCompare(b.name || '')
    })
  } catch (error) {
    console.error('获取课节列表失败', error)
    lessonList.value = []
  } finally {
    lessonLoading.value = false
  }
}

const handleEditBooking = async () => {
  try {
    // 根据lessonId找到对应的lessonName
    let lessonName = editBookingForm.lessonName
    if (editBookingForm.lessonId) {
      const selectedLesson = lessonList.value.find(l => l.id === editBookingForm.lessonId)
      if (selectedLesson) {
        lessonName = selectedLesson.name
      }
    }

    await updateBookingInfo(editBookingForm.bookingId, {
      materialId: editBookingForm.materialId,
      lessonId: editBookingForm.lessonId,
      lessonName: lessonName,
      remark: editBookingForm.remark
    })
    Message.success('修改预约成功')
    showEditBookingModal.value = false
    bookingPagination.value.current = 1 // 重置到第一页
    await getBookingList()
  } catch (error) {
    console.error('修改预约失败', error)
    Message.error('修改预约失败')
  }
}

const cancelEditBooking = () => {
  showEditBookingModal.value = false
}

// 取消预约
const onCancelBooking = async (record: any) => {
  try {
    await cancelBookingByTeacher(record.id)
    Message.success('取消预约成功')
    bookingPagination.value.current = 1 // 重置到第一页
    await getBookingList()
  } catch (error) {
    console.error('取消预约失败', error)
    Message.error('取消预约失败')
  }
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  visible.value = true
  loading.value = true

  // 重置分页状态
  pagination.value.current = 1
  bookingPagination.value.current = 1
  fixedBookingPagination.value.current = 1

  try {
    // 并行加载所有请求
    await Promise.all([
      getDataDetail(),
      getAccountInfo(),
      getTransactionList(),
      getBookingList(),
      getFixedBookingList(),
      loadMaterialDisplayMap()
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
  pagination.value.current = 1 // 重置到第一页
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
.main-tabs-section {
  margin-top: 24px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
}
.main-tabs :deep(.arco-tabs-nav) {
  margin-bottom: 0;
}
.main-tabs :deep(.arco-tabs-content) {
  padding-top: 12px;
}
.sub-tabs {
  margin-top: 0;
  padding-top: 0;
}
.sub-tabs :deep(.arco-tabs-nav) {
  margin-bottom: 0;
  background-color: #f7f8fa;
  padding: 4px;
  border-radius: 6px;
}
.sub-tabs :deep(.arco-tabs-tab) {
  padding: 6px 16px;
  margin: 0 2px;
  border-radius: 4px;
  font-size: 14px;
}
.sub-tabs :deep(.arco-tabs-tab-active) {
  background-color: #fff;
  font-weight: 500;
}
.sub-tabs :deep(.arco-tabs-content) {
  padding-top: 0;
}
.transaction-table,
.booking-table,
.fixed-booking-table {
  margin-top: 12px;
}
.transaction-table :deep(.arco-table-th),
.booking-table :deep(.arco-table-th),
.fixed-booking-table :deep(.arco-table-th) {
  background-color: #f7f8fa;
  font-weight: 600;
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
