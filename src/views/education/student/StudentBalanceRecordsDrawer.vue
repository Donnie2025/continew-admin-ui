<template>
  <a-drawer
    v-model:visible="visible"
    :title="`${studentName} - 余额操作记录`"
    :width="width >= 1000 ? 1000 : '100%'"
    :footer="false"
    unmount-on-close
  >
    <a-spin :loading="loading" style="width: 100%; min-height: 300px;">
      <a-empty v-if="!loading && records.length === 0" description="暂无操作记录" />
      <a-table
        v-if="!loading && records.length > 0"
        :data="records"
        :bordered="{ cell: true }"
        :pagination="{ pageSize: 10 }"
        size="medium"
      >
          <template #columns>
            <a-table-column title="操作时间" data-index="createTime" :width="180" />
            <a-table-column title="操作类型" :width="120">
              <template #cell="{ record }">
                {{ record.type === 'INCREASE' ? '充值' : '扣费' }}
              </template>
            </a-table-column>
            <a-table-column title="余额变化" :width="120" align="center">
              <template #cell="{ record }">
                <span :style="{ color: record.type === 'INCREASE' ? 'green' : 'red' }">
                  {{ record.type === 'INCREASE' ? '+' : '-' }}
                  {{ record.type === 'INCREASE' ? (record.creditAmount?.toFixed(0) || 0) : (record.debitAmount?.toFixed(0) || 0) }}
                </span>
              </template>
            </a-table-column>
            <a-table-column title="变动前余额" :width="120" align="center">
              <template #cell="{ record }">
                {{ record.beforeAmount?.toFixed(2) || 0 }}
              </template>
            </a-table-column>
            <a-table-column title="变动后余额" :width="120" align="center">
              <template #cell="{ record }">
                {{ record.afterAmount?.toFixed(2) || 0 }}
              </template>
            </a-table-column>
            <a-table-column title="操作人" data-index="operatorName" :width="120">
              <template #cell="{ record }">
                {{ record.operatorName || '-' }}
              </template>
            </a-table-column>
            <a-table-column title="备注" data-index="remark" :min-width="150">
              <template #cell="{ record }">
                {{ record.remark || '-' }}
              </template>
            </a-table-column>
          </template>
        </a-table>
    </a-spin>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { listBalanceRecords, type BalanceRecordResp } from '@/apis/education/student'

const { width } = useWindowSize()

const visible = ref(false)
const loading = ref(false)
const studentId = ref('')
const studentName = ref('')
const records = ref<BalanceRecordResp[]>([])

// 打开抽屉
const onOpen = async (id: string, name: string) => {
  studentId.value = id
  studentName.value = name
  visible.value = true
  await loadRecords()
}

// 加载操作记录
const loadRecords = async () => {
  try {
    loading.value = true
    const res = await listBalanceRecords(studentId.value)
    // 处理双重嵌套：res.data.data 才是真正的数组
    const data = res.data?.data || []
    records.value = Array.isArray(data) ? [...data] : []
  } catch (error) {
    console.error('加载操作记录失败', error)
    records.value = []
  } finally {
    loading.value = false
  }
}

defineExpose({ onOpen })
</script>

<style scoped lang="less">
:deep(.arco-table) {
  font-size: 14px;
}
</style>
