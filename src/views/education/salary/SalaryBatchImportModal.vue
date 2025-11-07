<template>
  <a-modal
    v-model:visible="visible"
    title="批量导入教师课程数量"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 800 ? 800 : '100%'"
    draggable
    @before-ok="handleImport"
    @close="reset"
  >
    <a-space direction="vertical" :size="16" fill>
      <!-- 使用说明 -->
      <a-alert type="info">
        <template #icon><icon-info-circle /></template>
        <div style="line-height: 1.8">
          <div><strong>导入说明：</strong></div>
          <div>1. 请将教师课程数据粘贴到下方文本框中</div>
          <div>2. 数据格式：每行一个教师，教师名和课程数之间用Tab键分隔</div>
          <div>3. 示例格式：Daisy[Tab]14</div>
          <div>4. 可以直接从Excel复制粘贴</div>
        </div>
      </a-alert>

      <!-- 日期范围选择（可选） -->
      <a-form :model="form" layout="inline">
        <a-form-item label="起始日期">
          <a-date-picker
            v-model="form.startDate"
            placeholder="默认为本周一"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
        </a-form-item>
        <a-form-item label="结束日期">
          <a-date-picker
            v-model="form.endDate"
            placeholder="默认为本周日"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 180px"
          />
        </a-form-item>
      </a-form>

      <!-- 数据输入区 -->
      <div>
        <div style="margin-bottom: 8px">
          <span style="color: var(--color-text-1)">导入数据</span>
          <span style="color: var(--color-danger); margin-left: 4px">*</span>
        </div>
        <a-textarea
          v-model="form.importData"
          placeholder="请粘贴教师课程数据，格式：教师名[Tab]课程数&#10;例如：&#10;Daisy&#9;14&#10;Rain&#9;81&#10;Kym&#9;26"
          :auto-size="{ minRows: 10, maxRows: 20 }"
          allow-clear
        />
        <div style="margin-top: 8px; color: var(--color-text-3); font-size: 12px">
          已输入 {{ dataLineCount }} 行数据
        </div>
      </div>

      <!-- 导入结果 -->
      <div v-if="importResult">
        <a-alert
          :type="importResult.failureCount > 0 ? 'warning' : 'success'"
          :title="`导入完成：成功 ${importResult.successCount} 条，失败 ${importResult.failureCount} 条`"
        >
          <template v-if="importResult.failures && importResult.failures.length > 0">
            <div style="margin-top: 12px">
              <div style="font-weight: bold; margin-bottom: 8px">失败详情：</div>
              <a-table
                :data="importResult.failures"
                :pagination="false"
                :max-height="200"
                size="small"
              >
                <template #columns>
                  <a-table-column title="教师名" data-index="teacherName" :width="120" />
                  <a-table-column title="课程数" data-index="courseCount" :width="80" />
                  <a-table-column title="失败原因" data-index="reason" />
                </template>
              </a-table>
            </div>
          </template>
        </a-alert>
      </div>
    </a-space>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { batchImportSalary, type SalaryBatchImportResp } from '@/apis/education/salary'

const emit = defineEmits<{
  (e: 'import-success'): void
}>()

const { width } = useWindowSize()
const visible = ref(false)
const importResult = ref<SalaryBatchImportResp | null>(null)

const form = reactive({
  importData: '',
  startDate: undefined as string | undefined,
  endDate: undefined as string | undefined
})

// 计算输入的数据行数
const dataLineCount = computed(() => {
  if (!form.importData) return 0
  return form.importData.split('\n').filter(line => line.trim()).length
})

// 重置
const reset = () => {
  form.importData = ''
  form.startDate = undefined
  form.endDate = undefined
  importResult.value = null
}

// 打开对话框
const onOpen = () => {
  reset()
  visible.value = true
}

// 执行导入
const handleImport = async () => {
  if (!form.importData || !form.importData.trim()) {
    Message.warning('请输入导入数据')
    return false
  }

  try {
    const { data } = await batchImportSalary({
      importData: form.importData,
      startDate: form.startDate,
      endDate: form.endDate
    })

    importResult.value = data

    if (data.failureCount === 0) {
      Message.success(`导入成功！共导入 ${data.successCount} 条数据`)
      emit('import-success')
      // 如果全部成功，关闭对话框
      setTimeout(() => {
        visible.value = false
      }, 1500)
    } else {
      Message.warning(`导入完成，成功 ${data.successCount} 条，失败 ${data.failureCount} 条`)
    }

    return false // 阻止对话框自动关闭，让用户查看结果
  } catch (error) {
    console.error('导入失败:', error)
    Message.error('导入失败，请检查数据格式')
    return false
  }
}

defineExpose({
  onOpen
})
</script>

<style scoped lang="scss">
:deep(.arco-alert) {
  .arco-alert-body {
    padding: 12px;
  }
}
</style>








