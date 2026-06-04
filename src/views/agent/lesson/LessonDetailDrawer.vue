<template>
  <a-drawer v-model:visible="visible" title="课堂详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="课堂名称">{{ detail?.name }}</a-descriptions-item>
      <a-descriptions-item label="教师">{{ detail?.teacherName }}</a-descriptions-item>
      <a-descriptions-item label="开始时间">{{ detail?.startTime }}</a-descriptions-item>
      <a-descriptions-item label="结束时间">{{ detail?.endTime }}</a-descriptions-item>
      <a-descriptions-item label="时长(分钟)">{{ detail?.duration }}</a-descriptions-item>
      <a-descriptions-item label="上台人数">{{ detail?.seatNum }}</a-descriptions-item>
      <a-descriptions-item label="是否录制">{{ detail?.recordState === 1 ? '是' : '否' }}</a-descriptions-item>
      <a-descriptions-item label="直播状态">{{ detail?.liveState }}</a-descriptions-item>
      <a-descriptions-item label="公开状态">{{ detail?.openState }}</a-descriptions-item>
      <a-descriptions-item label="课堂唯一标识" :span="2">{{ detail?.uniqueIdentity || '-' }}</a-descriptions-item>
      <a-descriptions-item label="直播地址" :span="2">{{ detail?.liveUrl || '-' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ detail?.createTime }}</a-descriptions-item>
      <a-descriptions-item label="更新时间">{{ detail?.updateTime }}</a-descriptions-item>
      <a-descriptions-item label="备注" :span="2">{{ detail?.remark || '-' }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type AgentLessonDetailResp, getAgentLesson } from '@/apis/agent/lesson'

defineOptions({ name: 'AgentLessonDetailDrawer' })

const { width } = useWindowSize()
const visible = ref(false)
const detail = ref<AgentLessonDetailResp>()

const onOpen = async (id: string) => {
  const { data } = await getAgentLesson(id)
  detail.value = data
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss"></style>
