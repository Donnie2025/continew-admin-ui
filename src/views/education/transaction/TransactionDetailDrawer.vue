<template>
  <a-drawer v-model:visible="visible" title="订单详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="学生会员卡绑定表ID">{{ dataDetail?.stuCardId }}</a-descriptions-item>
      <a-descriptions-item label="学生ID">{{ dataDetail?.stuId }}</a-descriptions-item>
      <a-descriptions-item label="学生姓名">{{ dataDetail?.stuName }}</a-descriptions-item>
      <a-descriptions-item label="会员卡ID">{{ dataDetail?.cardId }}</a-descriptions-item>
      <a-descriptions-item label="会员卡名称">{{ dataDetail?.cardName }}</a-descriptions-item>
      <a-descriptions-item label="变动类型">{{ dataDetail?.type }}</a-descriptions-item>
      <a-descriptions-item label="支出金额（扣款）">{{ dataDetail?.debitAmount }}</a-descriptions-item>
      <a-descriptions-item label="收入金额（充值/收入）">{{ dataDetail?.creditAmount }}</a-descriptions-item>
      <a-descriptions-item label="减少有效期天数">{{ dataDetail?.debitDays }}</a-descriptions-item>
      <a-descriptions-item label="增加有效期天数">{{ dataDetail?.creditDays }}</a-descriptions-item>
      <a-descriptions-item label="变动前余额/次数">{{ dataDetail?.beforeAmount }}</a-descriptions-item>
      <a-descriptions-item label="变动后余额/次数">{{ dataDetail?.afterAmount }}</a-descriptions-item>
      <a-descriptions-item label="实收金额">{{ dataDetail?.actualAmount }}</a-descriptions-item>
      <a-descriptions-item label="备注">{{ dataDetail?.remark }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="操作人ID">{{ dataDetail?.operatorId }}</a-descriptions-item>
      <a-descriptions-item label="操作人姓名">{{ dataDetail?.operatorName }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type TransactionDetailResp, getTransaction as getDetail } from '@/apis/education/transaction'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<TransactionDetailResp>()
const visible = ref(false)

// 查询详情
const getDataDetail = async () => {
  const { data } = await getDetail(dataId.value)
  dataDetail.value = data
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await getDataDetail()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
