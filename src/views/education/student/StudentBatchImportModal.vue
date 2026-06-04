<template>
  <a-modal
    v-model:visible="visible"
    title="批量导入学生"
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
          <div>1. 请将学生数据粘贴到下方文本框中</div>
          <div>2. 数据格式：每行一个学生，字段之间用 Tab 键分隔</div>
          <div>3. 示例格式：张三[Tab]13800138000[Tab]英绘口语降练</div>
          <div>4. 代理商列可选，支持：英绘口语降练、高能少年团、高能少年团150、高能少年团140、高能少年团20、林恩悦读坊、优言家庭英语、熊哥口语降练</div>
          <div>5. 可以直接从 Excel 复制粘贴</div>
          <div>6. 如果手机号已存在，将更新学生姓名和代理商</div>
        </div>
      </a-alert>

      <!-- 数据输入区 -->
      <div>
        <div style="margin-bottom: 8px">
          <span style="color: var(--color-text-1)">导入数据</span>
          <span style="color: var(--color-danger); margin-left: 4px">*</span>
        </div>
        <a-textarea
          v-model="form.importData"
          placeholder="请粘贴学生数据，格式：学生姓名[Tab]手机号码[Tab]代理商（可选）&#10;例如：&#10;一方净土&#9;18845148885&#9;英绘口语降练&#10;禾尊子&#9;15204676821&#9;高能少年团150&#10;junxi8&#9;15976155370"
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
          :type="importResult.failureCount > 0 ? 'error' : importResult.warningCount > 0 ? 'warning' : 'success'"
          :title="`导入完成：成功 ${importResult.successCount} 条，失败 ${importResult.failureCount} 条，警告 ${importResult.warningCount ?? 0} 条`"
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
                  <a-table-column title="学生姓名" data-index="studentName" :width="120" />
                  <a-table-column title="手机号" data-index="phone" :width="130" />
                  <a-table-column title="失败原因" data-index="reason" />
                </template>
              </a-table>
            </div>
          </template>
          <template v-if="importResult.warnings && importResult.warnings.length > 0">
            <div style="margin-top: 12px">
              <div style="font-weight: bold; margin-bottom: 8px">警告详情（已导入，但代理商未能匹配）：</div>
              <a-table
                :data="importResult.warnings"
                :pagination="false"
                :max-height="200"
                size="small"
              >
                <template #columns>
                  <a-table-column title="学生姓名" data-index="studentName" :width="120" />
                  <a-table-column title="手机号" data-index="phone" :width="130" />
                  <a-table-column title="警告信息" data-index="message" />
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
import { batchImportStudent, type StudentBatchImportResp } from '@/apis/education/student'

const emit = defineEmits<{
  (e: 'import-success'): void
}>()

const { width } = useWindowSize()
const visible = ref(false)
const importResult = ref<StudentBatchImportResp | null>(null)

const form = reactive({
  importData: ''
})

// 计算输入的数据行数
const dataLineCount = computed(() => {
  if (!form.importData) return 0
  return form.importData.split('\n').filter(line => line.trim()).length
})

// 重置
const reset = () => {
  form.importData = ''
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
    const response = await batchImportStudent({
      importData: form.importData
    })

    // 调试：打印完整响应
    console.log('批量导入响应:', response)
    
    // 兼容不同的响应格式
    const result = response.data || response
    
    importResult.value = result

    if (result.failureCount === 0) {
      Message.success(`导入成功！共导入 ${result.successCount} 条数据`)
      emit('import-success')
      // 如果全部成功，关闭对话框
      setTimeout(() => {
        visible.value = false
      }, 1500)
    } else {
      Message.warning(`导入完成，成功 ${result.successCount} 条，失败 ${result.failureCount} 条`)
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

