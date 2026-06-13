<template>
  <div class="gi_table_page">
    <GiTable
      title="订单管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
<!--	    <a-input-search v-model="queryForm.orderNo" placeholder="请输入订单编号" allow-clear @search="search" />-->
	    <a-input-search v-model="queryForm.studentName" placeholder="请输入学生姓名" allow-clear @search="search" @press-enter="search" />
	    <a-select v-model="queryForm.paymentMethod" placeholder="请选择支付类型" allow-clear @change="search" style="width: 200px">
	      <a-option value="online">在线支付</a-option>
	      <a-option value="qrcode">扫码支付</a-option>
	      <a-option value="offline">线下支付</a-option>
	    </a-select>
	    <a-select v-model="queryForm.orderStatus" placeholder="请选择订单状态" allow-clear @change="search" style="width: 200px">
	      <a-option value="PENDING">待确认</a-option>
	      <a-option value="COMPLETED">已完成</a-option>
	      <a-option value="CANCELLED">已取消</a-option>
	    </a-select>
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:order:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:order:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link 
            v-permission="['education:order:update']" 
            v-if="record.orderStatus === 'PENDING'"
            status="success"
            title="确认入账" 
            @click="onConfirm(record)"
          >
            确认入账
          </a-link>
          <a-link v-permission="['education:order:get']" title="详情" @click="onDetail(record)">详情</a-link>
<!--          <a-link v-permission="['education:order:update']" title="修改" @click="onUpdate(record)">修改</a-link>-->
<!--          <a-link-->
<!--            v-permission="['education:order:delete']"-->
<!--            status="danger"-->
<!--            :disabled="record.disabled"-->
<!--            :title="record.disabled ? '不可删除' : '删除'"-->
<!--            @click="onDelete(record)"-->
<!--          >-->
<!--            删除-->
<!--          </a-link>-->
        </a-space>
      </template>
    </GiTable>

    <OrderAddModal ref="OrderAddModalRef" @save-success="search" />
    <OrderDetailDrawer ref="OrderDetailDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import OrderAddModal from './OrderAddModal.vue'
import OrderDetailDrawer from './OrderDetailDrawer.vue'
import { type OrderResp, type OrderQuery, deleteOrder, exportOrder, listOrder, confirmOrder } from '@/apis/education/order'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Order' })

const queryForm = reactive<OrderQuery>({
  orderNo: undefined,
  studentName: undefined,
  cardId: undefined,
  cardTitle: undefined,
  cardType: undefined,
  paymentType: undefined,
  paymentMethod: undefined,
  orderStatus: undefined,
  createUser: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listOrder({ ...queryForm, ...page }), { immediate: true })

// 支付类型映射
const paymentMethodMap: Record<string, string> = {
  'online': '在线支付',
  'qrcode': '扫码支付',
  'offline': '线下支付'
}

// 订单状态映射
const orderStatusMap: Record<string, string> = {
  'PENDING': '待确认',
  'COMPLETED': '已完成',
  'CANCELLED': '已取消'
}

const columns: TableInstance['columns'] = [
  { title: 'ID', dataIndex: 'id',width: 50, slotName: 'id' },
  { title: '学生姓名', dataIndex: 'studentName', slotName: 'studentName' },
  { title: '会员卡标题', dataIndex: 'cardTitle', slotName: 'cardTitle' },
  { title: '订单金额', dataIndex: 'orderPrice', slotName: 'orderPrice' },
  { title: '支付渠道', dataIndex: 'paymentChannelName', slotName: 'paymentChannelName' },
  {
    title: '支付类型',
    dataIndex: 'paymentMethod',
    render: ({ record }: any) => paymentMethodMap[record.paymentMethod] || record.paymentMethod
  },
  {
    title: '订单状态',
    dataIndex: 'orderStatus',
    render: ({ record }: any) => orderStatusMap[record.orderStatus] || record.orderStatus
  },
  { title: '备注', dataIndex: 'remark', slotName: 'remark' },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 240,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:order:get', 'education:order:update', 'education:order:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.orderNo = undefined
  queryForm.studentName = undefined
  queryForm.cardId = undefined
  queryForm.cardTitle = undefined
  queryForm.cardType = undefined
  queryForm.paymentType = undefined
  queryForm.paymentMethod = undefined
  queryForm.orderStatus = undefined
  queryForm.createUser = undefined
  search()
}

// 确认入账
const onConfirm = (record: OrderResp) => {
  return handleDelete(() => confirmOrder(record.id), {
    content: `是否确认订单「${record.orderNo}」入账？`,
    successTip: '确认入账成功',
    showModal: true
  })
}

// 删除
const onDelete = (record: OrderResp) => {
  return handleDelete(() => deleteOrder(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportOrder(queryForm))
}

const OrderAddModalRef = ref<InstanceType<typeof OrderAddModal>>()
// 新增
const onAdd = () => {
  OrderAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: OrderResp) => {
  OrderAddModalRef.value?.onUpdate(record.id)
}

const OrderDetailDrawerRef = ref<InstanceType<typeof OrderDetailDrawer>>()
// 详情
const onDetail = (record: OrderResp) => {
  OrderDetailDrawerRef.value?.onOpen(record.id)
}
</script>

<style scoped lang="scss"></style>
