<template>
  <a-drawer v-model:visible="visible" title="会员卡管理详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="会员卡标题">{{ dataDetail?.title }}</a-descriptions-item>
      <a-descriptions-item label="副标题">{{ dataDetail?.subTitle }}</a-descriptions-item>
      <a-descriptions-item label="会员卡描述" :span="2">{{ dataDetail?.description }}</a-descriptions-item>
      <a-descriptions-item label="会员卡类型">{{ dataDetail?.type }}</a-descriptions-item>
      <a-descriptions-item label="初始次数">{{ dataDetail?.initTimes }}</a-descriptions-item>
      <a-descriptions-item label="初始天数">{{ dataDetail?.initDays }}</a-descriptions-item>
      <a-descriptions-item label="初始余额">{{ dataDetail?.initBalance }}</a-descriptions-item>
      <a-descriptions-item label="售卖价格">{{ dataDetail?.price }}</a-descriptions-item>
      <a-descriptions-item label="排序">{{ dataDetail?.sort }}</a-descriptions-item>
      <a-descriptions-item label="所属机构ID">{{ dataDetail?.institutionId }}</a-descriptions-item>
      <a-descriptions-item label="状态">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ dataDetail?.remark }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUserString }}</a-descriptions-item>
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
