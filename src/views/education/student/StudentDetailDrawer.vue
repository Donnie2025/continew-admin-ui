<template>
  <a-drawer v-model:visible="visible" title="学生管理详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="学生姓名">{{ dataDetail?.name }}</a-descriptions-item>
      <a-descriptions-item label="性别（0-未知 1-男 2-女）">{{ dataDetail?.gender }}</a-descriptions-item>
      <a-descriptions-item label="手机号码">{{ dataDetail?.phone }}</a-descriptions-item>
      <a-descriptions-item label="邮箱">{{ dataDetail?.email }}</a-descriptions-item>
      <a-descriptions-item label="注册时间">{{ dataDetail?.registerTime }}</a-descriptions-item>
      <a-descriptions-item label="所属代理的ID">{{ dataDetail?.agentId }}</a-descriptions-item>
      <a-descriptions-item label="头像地址">{{ dataDetail?.headImg }}</a-descriptions-item>
      <a-descriptions-item label="密码">{{ dataDetail?.password }}</a-descriptions-item>
      <a-descriptions-item label="备注">{{ dataDetail?.remark }}</a-descriptions-item>
      <a-descriptions-item label="状态（1：启用；2：禁用）">{{ dataDetail?.status }}</a-descriptions-item>
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
import { type StudentDetailResp, getStudent as getDetail } from '@/apis/education/student'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<StudentDetailResp>()
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
