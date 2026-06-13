<template>
  <a-drawer v-model:visible="visible" title="订单详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="订单编号">{{ dataDetail?.orderNo }}</a-descriptions-item>
      <a-descriptions-item label="学生ID">{{ dataDetail?.studentId }}</a-descriptions-item>
      <a-descriptions-item label="学生姓名">{{ dataDetail?.studentName }}</a-descriptions-item>
      <a-descriptions-item label="会员卡ID">{{ dataDetail?.cardId }}</a-descriptions-item>
      <a-descriptions-item label="会员卡标题">{{ dataDetail?.cardTitle }}</a-descriptions-item>
      <a-descriptions-item label="订单金额">{{ dataDetail?.orderPrice }}</a-descriptions-item>
      <a-descriptions-item label="支付方式">{{ dataDetail?.paymentType }}</a-descriptions-item>
      <a-descriptions-item label="订单状态">{{ dataDetail?.orderStatus }}</a-descriptions-item>
      <a-descriptions-item label="支付时间">{{ dataDetail?.paymentTime }}</a-descriptions-item>
      <a-descriptions-item label="确认时间">{{ dataDetail?.confirmTime }}</a-descriptions-item>
      <a-descriptions-item label="备注">{{ dataDetail?.remark }}</a-descriptions-item>
      <a-descriptions-item label="所属机构ID">{{ dataDetail?.institutionId }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUser }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUser }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type OrderDetailResp, getOrder as getDetail } from '@/apis/education/order'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<OrderDetailResp>()
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
