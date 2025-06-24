<template>
  <a-drawer v-model:visible="visible" title="课堂详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="主键ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="课程ID">{{ dataDetail?.courseId }}</a-descriptions-item>
      <a-descriptions-item label="ClassIn 课程ID">{{ dataDetail?.courseUid }}</a-descriptions-item>
      <a-descriptions-item label="ClassIn 活动ID">{{ dataDetail?.activityUid }}</a-descriptions-item>
      <a-descriptions-item label="ClassIn 课堂ID">{{ dataDetail?.classUid }}</a-descriptions-item>
      <a-descriptions-item label="单元ID">{{ dataDetail?.unitUid }}</a-descriptions-item>
      <a-descriptions-item label="课堂活动名称">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="主讲教师UID">{{ dataDetail?.teacherUid }}</a-descriptions-item>
      <a-descriptions-item label="活动开始时间">{{ dataDetail?.startTime }}</a-descriptions-item>
      <a-descriptions-item label="活动结束时间">{{ dataDetail?.endTime }}</a-descriptions-item>
      <a-descriptions-item label="上台人数">{{ dataDetail?.seatNum }}</a-descriptions-item>
      <a-descriptions-item label="录制状态">{{ dataDetail?.recordState }}</a-descriptions-item>
      <a-descriptions-item label="直播状态">{{ dataDetail?.liveState }}</a-descriptions-item>
      <a-descriptions-item label="公开状态">{{ dataDetail?.openState }}</a-descriptions-item>
      <a-descriptions-item label="课堂唯一标识">{{ dataDetail?.uniqueIdentity }}</a-descriptions-item>
      <a-descriptions-item label="课堂直播播放器地址">{{ dataDetail?.liveUrl }}</a-descriptions-item>
      <a-descriptions-item label="RTMP协议的拉流地址">{{ dataDetail?.rtmpUrl }}</a-descriptions-item>
      <a-descriptions-item label="HLS协议的拉流地址">{{ dataDetail?.hlsUrl }}</a-descriptions-item>
      <a-descriptions-item label="FLV协议的拉流地址">{{ dataDetail?.flvUrl }}</a-descriptions-item>
      <a-descriptions-item label="状态">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="创建者">{{ dataDetail?.createBy }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="更新者">{{ dataDetail?.updateBy }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ dataDetail?.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="备注">{{ dataDetail?.remark }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type LessonDetailResp, getLesson as getDetail } from '@/apis/education/lesson'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<LessonDetailResp>()
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
