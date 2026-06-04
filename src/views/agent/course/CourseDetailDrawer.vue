<template>
  <a-drawer v-model:visible="visible" title="班级详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="教室名称">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="班主任ID">{{ dataDetail?.mainTeacherId }}</a-descriptions-item>
      <a-descriptions-item label="Classin班主任ID">{{ dataDetail?.mainTeacherUid }}</a-descriptions-item>
      <a-descriptions-item label="机构课程唯一标识">{{ dataDetail?.courseUnique }}</a-descriptions-item>
      <a-descriptions-item label="classin教室ID">{{ dataDetail?.courseUid }}</a-descriptions-item>
      <a-descriptions-item label="教室设置ID">{{ dataDetail?.courseSettingId }}</a-descriptions-item>
      <a-descriptions-item label="状态（1：启用；2：禁用）">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="所属机构ID">{{ dataDetail?.institutionId }}</a-descriptions-item>
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
import { type CourseDetailResp, getCourse as getDetail } from '@/apis/education/course'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<CourseDetailResp>()
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
