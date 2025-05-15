<template>
  <a-drawer v-model:visible="visible" title="教师详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="教师姓名">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="评分">{{ dataDetail?.score }}</a-descriptions-item>
      <a-descriptions-item label="单价">{{ dataDetail?.rate }}</a-descriptions-item>
      <a-descriptions-item label="标签">{{ dataDetail?.tags }}</a-descriptions-item>
      <a-descriptions-item label="性别">{{ dataDetail?.gender === 'male' ? '男' : '女' }}</a-descriptions-item>
      <a-descriptions-item label="是否展示">{{ dataDetail?.isShow === '1' ? '是' : '否' }}</a-descriptions-item>
      <a-descriptions-item label="是否固定">{{ dataDetail?.isFixed === '1' ? '是' : '否' }}</a-descriptions-item>
      <a-descriptions-item label="手机号码">{{ dataDetail?.phone }}</a-descriptions-item>
      <a-descriptions-item label="邮箱">{{ dataDetail?.email }}</a-descriptions-item>
      <a-descriptions-item label="所属组">{{ dataDetail?.groupName }}</a-descriptions-item>
      <a-descriptions-item label="头像">
        <a-image
          v-if="dataDetail?.avatar"
          :src="dataDetail.avatar"
          :preview="true"
          width="40"
          height="40"
          fit="cover"
          style="border-radius: 50%"
        />
        <span v-else>暂无头像</span>
      </a-descriptions-item>
      <a-descriptions-item label="音频地址">{{ dataDetail?.audioUrl }}</a-descriptions-item>
      <a-descriptions-item label="视频地址">{{ dataDetail?.videoUrl }}</a-descriptions-item>
      <a-descriptions-item label="简介">{{ dataDetail?.briefIntro }}</a-descriptions-item>
      <a-descriptions-item label="描述">{{ dataDetail?.description }}</a-descriptions-item>
      <a-descriptions-item label="排序">{{ dataDetail?.sort }}</a-descriptions-item>
      <a-descriptions-item label="状态">{{ dataDetail?.status === '1' ? '启用' : '禁用' }}</a-descriptions-item>
      <a-descriptions-item label="创建时间">{{ dataDetail?.createTime }}</a-descriptions-item>
    </a-descriptions>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type TeacherDetailResp, getTeacher as getDetail } from '@/apis/education/teacher'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<TeacherDetailResp>()
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
