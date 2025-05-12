<template>
  <a-drawer v-model:visible="visible" title="会员绑卡详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="学生ID">{{ dataDetail?.stuId }}</a-descriptions-item>
      <a-descriptions-item label="学生姓名">{{ dataDetail?.stuName }}</a-descriptions-item>
      <a-descriptions-item label="会员卡ID">{{ dataDetail?.cardId }}</a-descriptions-item>
      <a-descriptions-item label="会员卡名称">{{ dataDetail?.cardName }}</a-descriptions-item>
      <a-descriptions-item label="会员卡类型（1：次卡有限期；2：次卡无限期；3：储蓄卡有限期；4：储蓄卡无限期）">{{ dataDetail?.cardType }}</a-descriptions-item>
      <a-descriptions-item label="剩余次数/余额">{{ dataDetail?.balance }}</a-descriptions-item>
      <a-descriptions-item label="到期日期">{{ dataDetail?.expireDate }}</a-descriptions-item>
      <a-descriptions-item label="状态（1：启用；0：禁用）">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="卡状态（1：启用，学生端可见；0：禁用，学生端不可见，后台管理系统可见）">{{ dataDetail?.cardStatus }}</a-descriptions-item>
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
import { type StuCardDetailResp, getStuCard as getDetail } from '@/apis/education/stuCard'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<StuCardDetailResp>()
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
