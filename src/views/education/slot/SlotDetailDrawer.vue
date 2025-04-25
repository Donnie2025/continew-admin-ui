<template>
  <a-drawer v-model:visible="visible" title="课程管理详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="所属教师ID">{{ dataDetail?.teacherId }}</a-descriptions-item>
      <a-descriptions-item label="教师名字">{{ dataDetail?.teacherName }}</a-descriptions-item>
      <a-descriptions-item label="开课日期（格式：YYYYMMDD）">{{ dataDetail?.startDate }}</a-descriptions-item>
      <a-descriptions-item label="开课时间（格式：HH:MM）">{{ dataDetail?.startTime }}</a-descriptions-item>
      <a-descriptions-item label="星期几（1：周一；2：周二；3：周三；4：周四；5：周五；6：周六；7：周日）">{{ dataDetail?.weekday }}</a-descriptions-item>
      <a-descriptions-item label="课程时长（单位为分钟）">{{ dataDetail?.duration }}</a-descriptions-item>
      <a-descriptions-item label="是否在线教室（0：否；1：是）">{{ dataDetail?.isOnline }}</a-descriptions-item>
      <a-descriptions-item label="状态（1：启用；0：禁用）">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUser }}</a-descriptions-item>
      <a-descriptions-item label="创建人">{{ dataDetail?.createUserString }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUser }}</a-descriptions-item>
      <a-descriptions-item label="修改人">{{ dataDetail?.updateUserString }}</a-descriptions-item>
      <a-descriptions-item label="所属机构ID">{{ dataDetail?.institutionId }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type SlotDetailResp, getSlot as getDetail } from '@/apis/education/slot'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<SlotDetailResp>()
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
