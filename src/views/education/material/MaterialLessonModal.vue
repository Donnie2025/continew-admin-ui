<template>
  <a-modal
    v-model:visible="visible"
    :title="`课节管理 - ${materialName}`"
    width="1100px"
    :footer="false"
    :mask-closable="false"
    unmount-on-close
  >
    <div class="lesson-modal-body">
      <!-- 工具栏 -->
      <div class="lesson-modal-toolbar">
        <div class="toolbar-left">
          <a-input-search
            v-model="queryForm.lessonName"
            placeholder="请输入课节名字"
            allow-clear
            style="width: 240px"
            @search="load"
            @clear="load"
          />
          <a-button @click="reset">
            <template #icon><icon-refresh /></template>
            重置
          </a-button>
        </div>
        <div class="toolbar-right">
          <a-button type="primary" @click="onAdd">
            <template #icon><icon-plus /></template>
            新增
          </a-button>
          <a-button @click="onImport">
            <template #icon><icon-import /></template>
            从飞书导入
          </a-button>
        </div>
      </div>

      <!-- 表格 -->
      <a-table
        :data="dataList"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        :scroll="{ y: 420 }"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      >
        <template #columns>
          <a-table-column title="课节名字" data-index="lessonName" :width="280" />
          <a-table-column title="课节链接" data-index="lessonUrl" :width="360">
            <template #cell="{ record }">
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
          </a-table-column>
          <a-table-column title="操作" :width="120" align="center" fixed="right">
            <template #cell="{ record }">
              <a-space>
                <a-link @click="onUpdate(record)">修改</a-link>
                <a-link status="danger" @click="onDelete(record)">删除</a-link>
              </a-space>
            </template>
          </a-table-column>
        </template>
      </a-table>
    </div>

    <!-- 课节链接弹窗 -->
    <a-modal
      v-model:visible="urlsModalVisible"
      title="课节链接"
      :width="600"
      :footer="false"
    >
      <div class="urls-list">
        <div v-for="(url, index) in currentUrls" :key="index" class="url-item">
          <a-link :href="url" target="_blank" :title="url" class="url-link">
            <icon-link class="mr-2" />
            {{ url }}
          </a-link>
        </div>
      </div>
    </a-modal>
  </a-modal>

  <MaterialLessonAddModal
    ref="addModalRef"
    :preset-material-id="materialId"
    @save-success="load"
  />
  <MaterialLessonImportModal
    ref="importModalRef"
    :preset-material-id="materialId"
    @import-success="load"
  />
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import MaterialLessonAddModal from '@/views/education/materialLesson/MaterialLessonAddModal.vue'
import MaterialLessonImportModal from '@/views/education/materialLesson/MaterialLessonImportModal.vue'
import {
  type MaterialLessonResp,
  type MaterialLessonPageQuery,
  listMaterialLesson,
  deleteMaterialLesson
} from '@/apis/education/materialLesson'

defineOptions({ name: 'MaterialLessonModal' })

const visible = ref(false)
const materialId = ref('')
const materialName = ref('')
const loading = ref(false)
const dataList = ref<MaterialLessonResp[]>([])

const queryForm = reactive({
  lessonName: undefined as string | undefined
})

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: true,
  showPageSize: true
})

const load = async () => {
  if (!materialId.value) return
  loading.value = true
  try {
    const { data } = await listMaterialLesson({
      materialId: materialId.value,
      lessonName: queryForm.lessonName,
      page: pagination.current,
      size: pagination.pageSize,
      sort: ['id,asc']
    } as MaterialLessonPageQuery)
    dataList.value = data.list || []
    pagination.total = data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const reset = () => {
  queryForm.lessonName = undefined
  pagination.current = 1
  load()
}

const onPageChange = (page: number) => {
  pagination.current = page
  load()
}

const onPageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.current = 1
  load()
}

// 删除
const onDelete = (record: MaterialLessonResp) => {
  Modal.confirm({
    title: '确认删除',
    content: `是否确定删除课节「${record.lessonName}」？`,
    onOk: async () => {
      try {
        await deleteMaterialLesson(record.id)
        Message.success('删除成功')
        load()
      } catch {
        Message.error('删除失败')
      }
    }
  })
}

const addModalRef = ref<InstanceType<typeof MaterialLessonAddModal>>()
const onAdd = () => {
  addModalRef.value?.onAdd()
}

const onUpdate = (record: MaterialLessonResp) => {
  addModalRef.value?.onUpdate(record.id)
}

const importModalRef = ref<InstanceType<typeof MaterialLessonImportModal>>()
const onImport = () => {
  importModalRef.value?.onOpen()
}

// 链接处理
const isMultipleUrls = (urlString: string): boolean => {
  if (!urlString) return false
  return urlString.includes('\n') || urlString.includes('|') || urlString.split('http').length > 2
}

const formatUrl = (url: string): string => {
  if (!url) return ''
  return url.length > 60 ? url.substring(0, 60) + '...' : url
}

const urlsModalVisible = ref(false)
const currentUrls = ref<string[]>([])

const showUrlsModal = (urlString: string) => {
  if (!urlString) return
  let urls: string[] = []
  if (urlString.includes('\n')) {
    urls = urlString.split('\n').filter(u => u.trim())
  } else if (urlString.includes('|')) {
    urls = urlString.split('|').filter(u => u.trim())
  } else {
    const parts = urlString.split('http')
    urls = parts.slice(1).map(p => 'http' + p).filter(u => u.trim())
  }
  currentUrls.value = urls
  urlsModalVisible.value = true
}

// 打开弹窗
const onOpen = (id: string, name: string) => {
  materialId.value = id
  materialName.value = name
  queryForm.lessonName = undefined
  pagination.current = 1
  visible.value = true
  load()
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.lesson-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lesson-modal-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.urls-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .url-item {
    padding: 8px;
    border-radius: 4px;
    background: var(--color-fill-2);

    .url-link {
      word-break: break-all;
    }
  }
}
</style>
