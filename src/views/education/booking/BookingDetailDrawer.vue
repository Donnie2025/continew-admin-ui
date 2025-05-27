<template>
  <a-drawer v-model:visible="visible" title="预约详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="所属课程ID">{{ dataDetail?.slotId }}</a-descriptions-item>
      <a-descriptions-item label="">{{ dataDetail?.startDate }}</a-descriptions-item>
      <a-descriptions-item label="">{{ dataDetail?.startTime }}</a-descriptions-item>
      <a-descriptions-item label="所属学生ID">{{ dataDetail?.studentId }}</a-descriptions-item>
      <a-descriptions-item label="所属学生姓名">{{ dataDetail?.studentName }}</a-descriptions-item>
      <a-descriptions-item label="预约手机号">{{ dataDetail?.phone }}</a-descriptions-item>
      <a-descriptions-item label="预约会员卡ID">{{ dataDetail?.cardId }}</a-descriptions-item>
      <a-descriptions-item label="预约会员卡名称">{{ dataDetail?.cardName }}</a-descriptions-item>
      <a-descriptions-item label="操作人名字">{{ dataDetail?.operatorName }}</a-descriptions-item>
      <a-descriptions-item label="操作时间">{{ dataDetail?.operateTime }}</a-descriptions-item>
      <a-descriptions-item label="预约教材ID">{{ dataDetail?.materialId }}</a-descriptions-item>
      <a-descriptions-item label="预约教材名字">{{ dataDetail?.materialName }}</a-descriptions-item>
      <a-descriptions-item label="预约课节名字">{{ dataDetail?.lessonName }}</a-descriptions-item>
      <a-descriptions-item label="预约教材链接">{{ dataDetail?.materialUrl }}</a-descriptions-item>
      <a-descriptions-item label="预约备注">{{ dataDetail?.remark }}</a-descriptions-item>
      <a-descriptions-item label="状态（1：启用；0：禁用）">{{ dataDetail?.status }}</a-descriptions-item>
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
import { type BookingDetailResp, getBooking as getDetail } from '@/apis/education/booking'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<BookingDetailResp>()
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
