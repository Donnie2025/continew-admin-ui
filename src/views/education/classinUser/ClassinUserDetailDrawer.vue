<template>
  <a-drawer v-model:visible="visible" title="Classin用户详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="昵称">{{ dataDetail?.nickname }}</a-descriptions-item>
      <a-descriptions-item label="成员类型">{{ dataDetail?.userType }}</a-descriptions-item>
      <a-descriptions-item label="Classin UID">{{ dataDetail?.uid }}</a-descriptions-item>
      <a-descriptions-item label="密码">{{ dataDetail?.password }}</a-descriptions-item>
      <a-descriptions-item label="手机号">{{ dataDetail?.telephone }}</a-descriptions-item>
      <a-descriptions-item label="邮箱">{{ dataDetail?.email }}</a-descriptions-item>
      <a-descriptions-item label="关联学生ID">{{ dataDetail?.studentId }}</a-descriptions-item>
      <a-descriptions-item label="关联教师ID">{{ dataDetail?.teacherId }}</a-descriptions-item>
      <a-descriptions-item label="关联Classin机构ID">
        <a-select v-model:value="selectedClassinOrgId" style="width: 100%;">
          <a-select-option v-for="option in classinOrgIdOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </a-select-option>
        </a-select>
      </a-descriptions-item>
      <a-descriptions-item label="状态（1：启用；2：禁用）">{{ dataDetail?.status }}</a-descriptions-item>
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
import { type ClassinUserDetailResp, getClassinUser as getDetail } from '@/apis/education/classinUser'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<ClassinUserDetailResp>()
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
