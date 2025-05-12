<template>
  <a-drawer v-model:visible="visible" title="会员卡管理详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="会员卡名称">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="会员卡类型">{{ dataDetail?.type }}</a-descriptions-item>
      <a-descriptions-item label="可用次数">{{ dataDetail?.availableCount }}</a-descriptions-item>
      <a-descriptions-item label="有效天数">{{ dataDetail?.availableDay }}</a-descriptions-item>
      <a-descriptions-item label="可用余额">{{ dataDetail?.availableBalance }}</a-descriptions-item>
      <a-descriptions-item label="代理售卖价格">{{ dataDetail?.price }}</a-descriptions-item>
      <a-descriptions-item label="是否仅代理可售">{{ dataDetail?.isAgentOnly }}</a-descriptions-item>
      <a-descriptions-item label="是否支持线上购卡">{{ dataDetail?.isOnlineSale }}</a-descriptions-item>
      <a-descriptions-item label="是否可续费">{{ dataDetail?.isRenewable }}</a-descriptions-item>
      <a-descriptions-item label="续费次数">{{ dataDetail?.renewTimes }}</a-descriptions-item>
      <a-descriptions-item label="续费天数">{{ dataDetail?.renewDays }}</a-descriptions-item>
      <a-descriptions-item label="续费价格">{{ dataDetail?.renewPrice }}</a-descriptions-item>
      <a-descriptions-item label="状态">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUser }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUserString }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUser }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUserString }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type CardDetailResp, getCard as getDetail } from '@/apis/education/card'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<CardDetailResp>()
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
