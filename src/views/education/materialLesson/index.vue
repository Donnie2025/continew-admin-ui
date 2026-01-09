<template>
  <div class="gi_table_page">
    <GiTable
      row-key="id"
      title="课节列表"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: '100%', y: '100%' }"
      :row-selection="{ type: 'checkbox', showCheckedAll: true }"
      :selected-keys="selectedRowKeys"
      @select="onSelect"
      @select-all="onSelectAll"
    >
      <template #toolbar-left>
	    <a-input-search v-model="queryForm.materialName" placeholder="请输入教材名称" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.lessonName" placeholder="请输入课节名字" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:materialLesson:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:materialLesson:create']" @click="onImport">
          <template #icon><icon-import /></template>
          <template #default>从飞书导入</template>
        </a-button>
        <a-button v-permission="['education:materialLesson:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
        <a-button
          v-permission="['education:materialLesson:delete']"
          type="primary"
          status="danger"
          :disabled="selectedRowKeys.length === 0"
          @click="onBatchDelete"
        >
          <template #icon><icon-delete /></template>
          <template #default>批量删除</template>
        </a-button>
      </template>
      <template #lessonUrl="{ record }">
        <div v-if="record.lessonUrl">
          <div v-if="isMultipleUrls(record.lessonUrl)">
            <a-button type="text" size="small" @click="showUrlsModal(record.lessonUrl)">
              <template #icon><icon-link /></template>
              查看链接
            </a-button>
          </div>
          <div v-else>
            <a-link :href="record.lessonUrl" target="_blank" :title="record.lessonUrl">
              {{ formatUrl(record.lessonUrl) }}
            </a-link>
          </div>
        </div>
        <span v-else class="text-gray-400">暂无链接</span>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:materialLesson:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:materialLesson:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link
            v-permission="['education:materialLesson:delete']"
            status="danger"
            :disabled="record.disabled"
            :title="record.disabled ? '不可删除' : '删除'"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <MaterialLessonAddModal ref="MaterialLessonAddModalRef" @save-success="search" />
    <MaterialLessonImportModal ref="MaterialLessonImportModalRef" @import-success="search" />
    <MaterialLessonDetailDrawer ref="MaterialLessonDetailDrawerRef" />
    
    <!-- 课节链接弹窗 -->
    <a-modal
      v-model:visible="urlsModalVisible"
      title="课节链接"
      :width="600"
      :footer="false"
    >
      <div class="urls-list">
        <div
          v-for="(url, index) in currentUrls"
          :key="index"
          class="url-item"
        >
          <a-link
            :href="url"
            target="_blank"
            :title="url"
            class="url-link"
            @click="openUrl(url)"
          >
            <icon-link class="mr-2" />
            {{ url }}
          </a-link>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import MaterialLessonAddModal from './MaterialLessonAddModal.vue'
import MaterialLessonImportModal from './MaterialLessonImportModal.vue'
import MaterialLessonDetailDrawer from './MaterialLessonDetailDrawer.vue'
import { type MaterialLessonResp, type MaterialLessonQuery, deleteMaterialLesson, batchDeleteMaterialLesson, exportMaterialLesson, listMaterialLesson } from '@/apis/education/materialLesson'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'
import { Message, Modal } from '@arco-design/web-vue'

defineOptions({ name: 'MaterialLesson' })


const queryForm = reactive<MaterialLessonQuery>({
  materialId: undefined,
  materialName: undefined,
  lessonName: undefined,
  status: undefined,
  createUser: undefined,
  createTime: undefined,
  sort: ['id,desc']
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listMaterialLesson({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '教材名称', dataIndex: 'materialName', slotName: 'materialName', width: 150 },
  { title: '课节名字', dataIndex: 'lessonName', slotName: 'lessonName', width: 280 },
  { title: '课节链接', dataIndex: 'lessonUrl', slotName: 'lessonUrl', width: 350 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 160,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:materialLesson:get', 'education:materialLesson:update', 'education:materialLesson:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.materialId = undefined
  queryForm.materialName = undefined
  queryForm.lessonName = undefined
  queryForm.status = undefined
  queryForm.createUser = undefined
  queryForm.createTime = undefined
  search()
}

// 删除
const onDelete = (record: MaterialLessonResp) => {
  return handleDelete(() => deleteMaterialLesson(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportMaterialLesson(queryForm))
}

const MaterialLessonAddModalRef = ref<InstanceType<typeof MaterialLessonAddModal>>()
// 新增
const onAdd = () => {
  MaterialLessonAddModalRef.value?.onAdd()
}

const MaterialLessonImportModalRef = ref<InstanceType<typeof MaterialLessonImportModal>>()
// 导入
const onImport = () => {
  MaterialLessonImportModalRef.value?.onOpen()
}

// 修改
const onUpdate = (record: MaterialLessonResp) => {
  MaterialLessonAddModalRef.value?.onUpdate(record.id)
}

const MaterialLessonDetailDrawerRef = ref<InstanceType<typeof MaterialLessonDetailDrawer>>()
// 详情
const onDetail = (record: MaterialLessonResp) => {
  MaterialLessonDetailDrawerRef.value?.onOpen(record.id)
}

// 链接处理相关方法
const isMultipleUrls = (urlString: string): boolean => {
  if (!urlString) return false
  // 检查是否包含多个链接（通过换行符或分隔符判断）
  return urlString.includes('\n') || urlString.includes('|') || urlString.split('http').length > 2
}

const formatUrl = (url: string): string => {
  if (!url) return ''
  // 由于课节链接列宽度增加到300px，可以显示更长的URL
  if (url.length > 60) {
    return url.substring(0, 60) + '...'
  }
  return url
}

// 链接弹窗相关
const urlsModalVisible = ref(false)
const currentUrls = ref<string[]>([])

const showUrlsModal = (urlString: string) => {
  if (!urlString) return
  
  // 解析多个链接
  let urls: string[] = []
  if (urlString.includes('\n')) {
    urls = urlString.split('\n').filter(url => url.trim())
  } else if (urlString.includes('|')) {
    urls = urlString.split('|').filter(url => url.trim())
  } else {
    // 通过http分割
    const parts = urlString.split('http')
    urls = parts.slice(1).map(part => 'http' + part).filter(url => url.trim())
  }
  
  currentUrls.value = urls
  urlsModalVisible.value = true
}

const openUrl = (url: string) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 批量删除相关
const selectedRowKeys = ref<string[]>([])

// 选择事件处理
const onSelect = (rowKeys: string[]) => {
  selectedRowKeys.value = rowKeys
}

const onSelectAll = (checked: boolean) => {
  if (checked) {
    selectedRowKeys.value = dataList.value.map(item => item.id)
  } else {
    selectedRowKeys.value = []
  }
}

// 批量删除方法
const onBatchDelete = () => {
  if (selectedRowKeys.value.length === 0) {
    Message.warning('请选择要删除的数据')
    return
  }
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedRowKeys.value.length} 条课节数据吗？此操作为物理删除，不可恢复！`,
    onOk: async () => {
      try {
        await batchDeleteMaterialLesson(selectedRowKeys.value)
        Message.success('批量删除成功')
        selectedRowKeys.value = []
        search()
      } catch (error) {
        Message.error('批量删除失败')
      }
    }
  })
}
</script>

<style scoped lang="scss">
.urls-list {
  .url-item {
    margin-bottom: 12px;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 6px;
    border-left: 3px solid #1890ff;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .url-link {
      display: flex;
      align-items: center;
      word-break: break-all;
      color: #1890ff;
      
      &:hover {
        color: #40a9ff;
      }
    }
  }
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
