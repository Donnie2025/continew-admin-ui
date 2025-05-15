<template>
  <a-drawer v-model:visible="visible" title="薪资详情" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <a-descriptions :column="2" size="large" class="general-description">
      <a-descriptions-item label="ID">{{ dataDetail?.id }}</a-descriptions-item>
      <a-descriptions-item label="教师ID">{{ dataDetail?.teacherId }}</a-descriptions-item>
      <a-descriptions-item label="教师姓名">{{ dataDetail?.teacherName }}</a-descriptions-item>
      <a-descriptions-item label="起始日期">{{ dataDetail?.startDate }}</a-descriptions-item>
      <a-descriptions-item label="结束日期">{{ dataDetail?.endDate }}</a-descriptions-item>
      <a-descriptions-item label="课程总数">{{ dataDetail?.courseCount }}</a-descriptions-item>
      <a-descriptions-item label="课程总金额">{{ dataDetail?.courseAmount }}</a-descriptions-item>
      <a-descriptions-item label="扣款金额">{{ dataDetail?.deductionAmount }}</a-descriptions-item>
      <a-descriptions-item label="小费金额">{{ dataDetail?.tipAmount }}</a-descriptions-item>
      <a-descriptions-item label="最终支付金额">{{ dataDetail?.finalAmount }}</a-descriptions-item>
      <a-descriptions-item label="状态（0：未结算；1：已结算）">{{ dataDetail?.status }}</a-descriptions-item>
      <a-descriptions-item label="单价">{{ dataDetail?.rate }}</a-descriptions-item>
      <a-descriptions-item label="所属组">{{ dataDetail?.groupName }}</a-descriptions-item>
      <a-descriptions-item label="备注">{{ dataDetail?.remark }}</a-descriptions-item>
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
import { type SalaryDetailResp, getSalary as getDetail } from '@/apis/education/salary'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<SalaryDetailResp>()
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
