<template>
  <a-drawer v-model:visible="visible" title="课节详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="主键ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="教材ID">{{ dataDetail?.materialId }}</a-descriptions-item>
      <a-descriptions-item label="教材名称（冗余字段，格式：name + level）">{{ dataDetail?.materialName }}</a-descriptions-item>
      <a-descriptions-item label="课节名字">{{ dataDetail?.lessonName }}</a-descriptions-item>
      <a-descriptions-item label="课节链接">{{ dataDetail?.lessonUrl }}</a-descriptions-item>
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
import { type MaterialLessonDetailResp, getMaterialLesson as getDetail } from '@/apis/education/materialLesson'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<MaterialLessonDetailResp>()
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
