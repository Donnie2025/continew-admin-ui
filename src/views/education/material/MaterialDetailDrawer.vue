<template>
  <a-drawer v-model:visible="visible" title="教材详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="主键ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="教材编码">{{ dataDetail?.code }}</a-descriptions-item>
      <a-descriptions-item label="教材名字">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="级别（K1:幼儿园小班 K2:幼儿园中班 K3:幼儿园大班 G1-G12:1-12年级 ADULT:成人）">{{ dataDetail?.level }}</a-descriptions-item>
      <a-descriptions-item label="分类（CHILDREN:少儿启蒙 TEENAGER:青少年 ADULT:成人教材 COMPREHENSIVE:综合教材 READING:阅读绘本 PHONICS:自然拼读 EXAM:考试教材 GRAMMAR:语法）">{{ dataDetail?.category }}</a-descriptions-item>
      <a-descriptions-item label="封面图片">{{ dataDetail?.coverImg }}</a-descriptions-item>
      <a-descriptions-item label="教材描述">{{ dataDetail?.desc }}</a-descriptions-item>
      <a-descriptions-item label="是否前端展示（1:展示 0:不展示）">{{ dataDetail?.isShow }}</a-descriptions-item>
      <a-descriptions-item label="排序">{{ dataDetail?.sort }}</a-descriptions-item>
      <a-descriptions-item label="状态（1:启用 0:禁用）">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUser }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUserString }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUser }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUserString }}</a-descriptions-item>
      <a-descriptions-item label="修改时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type MaterialDetailResp, getMaterial as getDetail } from '@/apis/education/material'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<MaterialDetailResp>()
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
