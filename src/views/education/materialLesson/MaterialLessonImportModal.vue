<template>
  <a-modal
    v-model:visible="visible"
    title="从飞书链接导入课节"
    width="800px"
    :confirm-loading="loading"
    :mask-closable="false"
    @ok="onSubmit"
    @cancel="onCancel"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-form-item label="选择教材" name="materialId" required>
        <a-select
          v-model="form.materialId"
          placeholder="请选择要导入课节的教材"
          show-search
          :filter-option="filterOption"
          @change="onMaterialChange"
          :options="materialOptions"
        />
      </a-form-item>

      <a-form-item label="飞书文件夹链接" name="feishuUrl" required>
        <a-input
          v-model="form.feishuUrl"
          placeholder="请输入飞书文件夹链接，如：https://ai.feishu.cn/drive/folder/TEV8fJml3lsaj2dLBOUcxovanvc"
          :rows="2"
        />
        <div class="text-gray-500 text-sm mt-1">
          <icon-info-circle class="mr-1" />
          支持飞书云文档的文件夹分享链接
        </div>
      </a-form-item>

      <a-form-item label="导入选项" name="overwrite">
        <a-checkbox v-model="form.overwrite" @change="onOverwriteChange">
          覆盖已存在的同名课节
        </a-checkbox>
        <div class="text-gray-500 text-sm mt-1">
          勾选后，如果存在同名课节将被覆盖；不勾选则跳过同名课节
        </div>
      </a-form-item>

      <a-form-item label="备注" name="remark">
        <a-textarea
          v-model="form.remark"
          placeholder="可选，记录本次导入的相关信息"
          :rows="3"
          :max-length="500"
          show-count
        />
      </a-form-item>
    </a-form>

    <!-- 导入结果展示 -->
    <div v-if="importResult" class="mt-4 p-4 bg-gray-50 rounded">
      <h4 class="mb-3 font-medium">导入结果</h4>
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">{{ importResult.totalCount }}</div>
          <div class="text-sm text-gray-600">总计</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">{{ importResult.successCount }}</div>
          <div class="text-sm text-gray-600">成功</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">{{ importResult.failureCount }}</div>
          <div class="text-sm text-gray-600">失败</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-yellow-600">{{ importResult.skipCount }}</div>
          <div class="text-sm text-gray-600">跳过</div>
        </div>
      </div>

      <!-- 成功列表 -->
      <div v-if="importResult.successLessons.length > 0" class="mb-3">
        <h5 class="text-green-600 font-medium mb-2">成功导入 ({{ importResult.successCount }})</h5>
        <div class="max-h-32 overflow-y-auto">
          <a-tag v-for="lesson in importResult.successLessons" :key="lesson" color="green" class="mb-1">
            {{ lesson }}
          </a-tag>
        </div>
      </div>

      <!-- 失败列表 -->
      <div v-if="importResult.failureLessons.length > 0" class="mb-3">
        <h5 class="text-red-600 font-medium mb-2">导入失败 ({{ importResult.failureCount }})</h5>
        <div class="max-h-32 overflow-y-auto">
          <div v-for="failure in importResult.failureLessons" :key="failure.lessonName" class="mb-2">
            <a-tag color="red">{{ failure.lessonName }}</a-tag>
            <span class="text-sm text-gray-600 ml-2">{{ failure.reason }}</span>
          </div>
        </div>
      </div>

      <!-- 跳过列表 -->
      <div v-if="importResult.skipLessons.length > 0">
        <h5 class="text-yellow-600 font-medium mb-2">跳过课节 ({{ importResult.skipCount }})</h5>
        <div class="max-h-32 overflow-y-auto">
          <a-tag v-for="lesson in importResult.skipLessons" :key="lesson" color="orange" class="mb-1">
            {{ lesson }}
          </a-tag>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed } from 'vue'
import type { FormInstance } from '@arco-design/web-vue'
import { type MaterialLessonImportReq, type MaterialLessonImportResp, importMaterialLessonFromFeishu } from '@/apis/education/materialLesson'
import { listMaterial } from '@/apis/education/material'
import { Message } from '@arco-design/web-vue'

defineOptions({ name: 'MaterialLessonImportModal' })

const emit = defineEmits<{
  'import-success': []
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const importResult = ref<MaterialLessonImportResp | null>(null)

// 表单数据
const form = reactive<MaterialLessonImportReq>({
  materialId: '',
  feishuUrl: '',
  overwrite: false,
  remark: ''
})

// 教材列表
const materialList = ref<any[]>([])

// 教材选项（用于下拉框）
const materialOptions = computed(() => {
  return materialList.value.map(material => ({
    label: `${material.name} (${material.level})`,
    value: material.id
  }))
})

// 表单验证规则
const rules = {
  materialId: [
    { required: true, message: '请选择教材' }
  ],
  feishuUrl: [
    { required: true, message: '请输入飞书文件夹链接' },
    { 
      pattern: /^https:\/\/[^\/]+\/drive\/folder\/[a-zA-Z0-9]+/, 
      message: '请输入正确的飞书文件夹链接格式' 
    }
  ]
}

// 筛选选项
const filterOption = (input: string, option: any) => {
  const text = option.children?.toLowerCase() || ''
  return text.includes(input.toLowerCase())
}

// 教材变更
const onMaterialChange = (value: string) => {
  console.log('教材选择变更:', value)
  console.log('form.materialId 更新为:', form.materialId)
  // 清空之前的导入结果
  importResult.value = null
}

// 覆盖选项变更
const onOverwriteChange = (checked: boolean) => {
  console.log('覆盖选项变更:', checked)
  console.log('form.overwrite 更新为:', form.overwrite)
}

// 获取教材列表
const getMaterialList = async () => {
  try {
    const { data } = await listMaterial({ 
      page: 1, 
      size: 1000
    } as any)
    materialList.value = data.list || []
    console.log(`成功加载 ${materialList.value.length} 个教材`)
  } catch (error) {
    console.error('获取教材列表失败:', error)
    Message.error('获取教材列表失败')
  }
}

// 提交表单
const onSubmit = async () => {
  console.log('onSubmit 开始执行')
  console.log('表单数据:', form)
  
  try {
    console.log('开始表单验证...')
    try {
      await formRef.value?.validate()
      console.log('表单验证通过')
    } catch (error) {
      console.log('表单验证失败:', error)
      return
    }

    console.log('开始导入，设置loading状态')
    loading.value = true
    
    console.log('调用导入API...')
    const { data } = await importMaterialLessonFromFeishu(form)
    console.log('导入API响应:', data)
    
    importResult.value = data
    
    if (data.successCount > 0) {
      Message.success(`导入完成！成功 ${data.successCount} 个，失败 ${data.failureCount} 个，跳过 ${data.skipCount} 个`)
      emit('import-success')
    } else if (data.failureCount > 0) {
      Message.warning(`导入完成，但所有课节都导入失败，请检查飞书链接或网络连接`)
    } else {
      Message.info(`导入完成，所有课节都被跳过（可能已存在同名课节）`)
    }
  } catch (error: any) {
    console.error('导入失败:', error)
    console.error('错误详情:', error.response || error.message)
    Message.error('导入失败，请检查飞书链接是否正确')
  } finally {
    console.log('导入完成，清除loading状态')
    loading.value = false
  }
}

// 取消
const onCancel = () => {
  visible.value = false
  resetForm()
}

// 重置表单
const resetForm = () => {
  form.materialId = ''
  form.feishuUrl = ''
  form.overwrite = false
  form.remark = ''
  importResult.value = null
  formRef.value?.resetFields()
}

// 打开弹窗
const onOpen = () => {
  visible.value = true
  resetForm()
  getMaterialList()
}

// 暴露方法
defineExpose({
  onOpen
})
</script>

<style scoped lang="scss">
:deep(.arco-form-item-label) {
  font-weight: 500;
}

:deep(.arco-tag) {
  margin-right: 8px;
  margin-bottom: 4px;
}
</style>
