<template>
  <div class="material-page">
    <div class="material-header">
      <a-input-search
        v-model="searchName"
        placeholder="搜索名称或编码..."
        allow-clear
        style="width: 280px"
        @search="onSearch"
        @clear="onClearSearch"
        @press-enter="onSearch"
      />
      <div class="header-actions">
        <a-button v-permission="['education:material:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>新增
        </a-button>
        <a-button v-if="selectedRowKeys.length" status="danger" @click="onBatchDelete">
          <template #icon><icon-delete /></template>批量删除 ({{ selectedRowKeys.length }})
        </a-button>
        <a-button v-permission="['education:material:export']" @click="onExport">
          <template #icon><icon-download /></template>导出
        </a-button>
        <a-button @click="onOpenCloudBrowser">
          <template #icon><icon-cloud /></template>云盘文件夹
        </a-button>
        <a-button :loading="syncNamesLoading" @click="onSyncNamesToCloud">
          <template #icon><icon-sync /></template>同步名称到云盘
        </a-button>
        <a-button :loading="syncCloudDataLoading" @click="onSyncCloudData">
          <template #icon><icon-download /></template>同步ClassIn数据
        </a-button>
        <a-space style="margin-left: 4px">
          <span style="font-size:13px;color:var(--color-text-2)">同步飞书</span>
          <a-switch v-model="enableFeishuSync" size="small" />
        </a-space>
        <a-space style="margin-left: 4px">
          <span style="font-size:13px;color:var(--color-text-2)">同步ClassIn</span>
          <a-switch v-model="enableClassInSync" size="small" />
        </a-space>
      </div>
    </div>

    <div class="material-body">
      <div class="tree-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">教材目录</span>
          <a-button size="mini" shape="circle" :loading="treeLoading" @click="loadTree">
            <template #icon><icon-refresh /></template>
          </a-button>
        </div>
        <div class="sidebar-scroll">
          <a-tree
            v-if="treeNodes.length"
            :data="treeNodes"
            :selected-keys="selectedKeys"
            :expanded-keys="expandedKeys"
            block-node
            show-line
            @select="onTreeNodeSelect"
            @expand="onTreeExpand"
          >
            <template #title="{ title, raw }">
              <span class="tree-node-item">
                <component :is="typeIconMap[raw?.type] || 'icon-file'" class="tree-node-icon" />
                {{ title }}
              </span>
            </template>
          </a-tree>
          <div v-else-if="treeLoading" style="padding: 16px">
            <a-skeleton :animation="true"><a-skeleton-line :rows="6" /></a-skeleton>
          </div>
          <a-empty v-else :image-size="60" description="暂无数据" style="margin-top: 40px" />
        </div>
      </div>

      <div class="content-area"
           @dragenter.prevent="onDragEnter"
           @dragover.prevent
           @dragleave="onDragLeave"
           @drop.prevent="onFileDrop">
        <div v-if="isDragging" class="drop-overlay">
          <div class="drop-overlay-inner">
            <template v-if="canUpload">
              <icon-cloud-upload style="font-size:48px;color:var(--color-primary-6)" />
              <p>释放文件上传到 "{{ selectedMaterial?.name || '当前节点' }}"</p>
            </template>
            <template v-else>
              <icon-warning style="font-size:48px;color:var(--color-warning-6)" />
              <p>{{ uploadWarningMessage }}</p>
            </template>
          </div>
        </div>
        <div class="content-top">
          <template v-if="isSearchMode">
            <a-tag color="arcoblue" style="font-size: 13px">搜索: "{{ lastSearchName }}"</a-tag>
            <a-link style="margin-left: 8px" @click="onClearSearch">清除</a-link>
          </template>
          <a-breadcrumb v-else>
            <a-breadcrumb-item><a-link @click="selectRoot">全部</a-link></a-breadcrumb-item>
            <a-breadcrumb-item v-for="(crumb, i) in breadcrumbs" :key="crumb.id">
              <a-link v-if="i < breadcrumbs.length - 1" @click="selectBreadcrumb(i)">{{ crumb.name }}</a-link>
              <span v-else>{{ crumb.name }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>

        <div ref="tableWrapperRef" style="flex: 1; overflow: hidden; min-height: 0;">
        <a-table
          :data="tableData"
          :loading="tableLoading"
          row-key="id"
          :row-selection="{ type: 'checkbox', showCheckedAll: true, selectedRowKeys: selectedRowKeys }"
          @select="(rowKeys) => (selectedRowKeys = rowKeys)"
          @select-all="(checked) => (selectedRowKeys = checked ? tableData.map((r: any) => r.id) : [])"
          :pagination="tablePagination"
          :scroll="{ x: 900, y: tableScrollY }"
          @page-change="onPageChange"
          @page-size-change="onPageSizeChange"
        >
          <template #columns>
            <a-table-column title="名称" data-index="name" :min-width="200">
              <template #cell="{ record }">
                <span class="node-name" style="display:flex;align-items:center;gap:4px">
                  <component :is="typeIconMap[record.type] || 'icon-file'" :style="{ color: getTypeColor(record.type), marginRight: '2px', fontSize: '14px', flexShrink: 0 }" />
                  <template v-if="inlineEditId === record.id">
                    <a-input
                      v-model="inlineEditName"
                      size="small"
                      style="flex:1"
                      allow-clear
                      @keyup.enter="onInlineEditSave(record)"
                      @keyup.escape="inlineEditId = null"
                    />
                    <a-link @click="onInlineEditSave(record)">保存</a-link>
                    <a-link @click="inlineEditId = null">取消</a-link>
                  </template>
                  <template v-else>
                    <a-link v-if="record.type !== 'LESSON'" @click="enterNode(record)">{{ record.name }}</a-link>
                    <a-link v-else-if="record.lessonUrl" @click="onPreview(record)" status="success">{{ record.name }}</a-link>
                    <span v-else>{{ record.name }}</span>
                    <a-link @click="onInlineEditStart(record)" style="margin-left:2px;color:#999;flex-shrink:0"><icon-edit /></a-link>
                  </template>
                </span>
              </template>
            </a-table-column>
            <a-table-column v-if="hasBookType" title="编码" data-index="code" :width="150" />
            <a-table-column title="类型" data-index="type" :width="110">
              <template #cell="{ record }">
                <a-tag :color="getTypeColor(record.type)" size="small">{{ getTypeLabel(record.type) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="排序" data-index="sort" :width="70" align="center" />
            <a-table-column title="展示" :width="70" align="center">
              <template #cell="{ record }">
                <a-tag size="small" :color="record.isShow ? 'green' : 'gray'">{{ record.isShow ? '是' : '否' }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作" :width="280" fixed="right" align="center">
              <template #cell="{ record }">
                <a-space>
                  <a-link v-permission="['education:material:update']" @click="onUpdate(record)">修改</a-link>
                  <a-link @click="onManageLessons(record)">课节</a-link>
                  <a-link v-if="record.cloudId" @click="onOpenCloudBrowserById(record)">云盘</a-link>
                  <a-link v-if="record.type !== 'LESSON'" @click="onSyncFeishu(record)">同步飞书</a-link>
                  <a-link v-permission="['education:material:delete']" status="danger" :disabled="record.disabled" @click="onDelete(record)">删除</a-link>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
        </div>
        <div v-if="uploadQueue.length" class="upload-queue">
          <div class="upload-queue-header">
            <span>上传队列 {{ batchProcessed }}/{{ batchTotal }}</span>
            <a-link @click="uploadQueue = []">清空</a-link>
          </div>
          <div v-for="item in uploadQueue" :key="item.id" class="upload-queue-item">
            <icon-check-circle v-if="item.status === 'done'" style="color:#00b42a;flex-shrink:0" />
            <icon-close-circle v-else-if="item.status === 'error'" style="color:#f53f3f;flex-shrink:0" />
            <icon-loading v-else style="color:var(--color-primary-6);flex-shrink:0" spin />
            <span class="upload-item-name" :title="item.name">{{ item.name }}</span>
            <span v-if="item.error" class="upload-item-error">{{ item.error }}</span>
          </div>
        </div>
      </div>
    </div>

    <MaterialAddModal ref="MaterialAddModalRef" @save-success="onSaveSuccess" />
    <MaterialDetailDrawer ref="MaterialDetailDrawerRef" />
    <MaterialLessonModal ref="MaterialLessonModalRef" />

    <!-- 同步飞书弹窗 -->
    <a-modal
      v-model:visible="syncFeishuModalVisible"
      title="同步飞书确认"
      width="440px"
      :mask-closable="false"
      ok-text="确定"
      cancel-text="取消"
      @ok="onSyncFeishuConfirm"
    >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <p style="margin: 0">将同步「{{ syncFeishuRecord?.name }}」到飞书</p>
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--color-fill-2); border-radius: 4px">
          <span style="font-size: 13px">递归同步所有子节点</span>
          <a-switch v-model="syncFeishuRecursive" size="small" />
        </div>
      </div>
    </a-modal>

    <!-- 云盘文件夹浏览器 -->
    <a-modal
      v-model:visible="cloudBrowserVisible"
      title="云盘文件夹浏览器"
      width="1200px"
      :footer="false"
      unmount-on-close
      :body-style="{ height: '75vh', overflowY: 'auto', padding: '16px 24px', boxSizing: 'border-box' }"
    >
      <div class="cloud-browser">
        <div class="cloud-browser-toolbar">
          <a-input
            v-model="cloudFolderId"
            placeholder="请输入文件夹ID（留空则为根目录）"
            allow-clear
            style="flex: 1"
          />
          <a-button :disabled="cloudBreadcrumbs.length <= 1" @click="onBackFolder">
            <template #icon><icon-left /></template>
            上一层
          </a-button>
          <a-button type="primary" :loading="cloudListLoading" @click="onFetchCloudList">
            <template #icon><icon-refresh /></template>
            获取列表
          </a-button>
          <a-button
            v-if="cloudListData"
            type="outline"
            status="success"
            @click="onOpenSyncModal"
          >
            <template #icon><icon-import /></template>
            同步到教材
          </a-button>
        </div>

        <a-breadcrumb class="cloud-breadcrumb">
          <a-breadcrumb-item v-for="(item, index) in cloudBreadcrumbs" :key="item.id || 'root'">
            <a-link
              v-if="index < cloudBreadcrumbs.length - 1"
              @click="onClickBreadcrumb(index)"
            >{{ item.name }}</a-link>
            <span v-else>{{ item.name }}</span>
          </a-breadcrumb-item>
        </a-breadcrumb>

        <div v-if="cloudListData" class="cloud-list">
          <div v-if="cloudListData.folder_list && cloudListData.folder_list.length" class="cloud-section">
            <div class="cloud-section-title"><icon-folder /> 文件夹 ({{ cloudListData.folder_list.length }})</div>
            <a-table
              :data="cloudListData.folder_list"
              :pagination="false"
              size="small"
            >
              <template #columns>
                <a-table-column title="文件夹ID" data-index="folder_id" :width="200">
                  <template #cell="{ record }">
                    <a-typography-paragraph copyable :style="{ marginBottom: 0 }">
                      {{ record.folder_id }}
                    </a-typography-paragraph>
                  </template>
                </a-table-column>
                <a-table-column
                  title="文件夹名称"
                  data-index="folder_name"
                  :sortable="{ sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend' }"
                >
                  <template #cell="{ record }">
                    <a-link @click="onEnterFolder(record.folder_id, record.folder_name)">{{ record.folder_name }}</a-link>
                  </template>
                </a-table-column>
                <a-table-column title="系统文件夹" :width="100" align="center">
                  <template #cell="{ record }">
                    <a-tag :color="record.is_system_folder === 1 ? 'blue' : 'gray'">
                      {{ record.is_system_folder === 1 ? '是' : '否' }}
                    </a-tag>
                  </template>
                </a-table-column>
              </template>
            </a-table>
          </div>
          <div v-if="cloudListData.file_list && cloudListData.file_list.length" class="cloud-section">
            <div class="cloud-section-title"><icon-file /> 文件 ({{ cloudListData.file_list.length }})</div>
            <a-table
              :data="cloudListData.file_list"
              :pagination="false"
              size="small"
            >
              <template #columns>
                <a-table-column title="文件ID" data-index="id" :width="200">
                  <template #cell="{ record }">
                    <a-typography-paragraph copyable :style="{ marginBottom: 0 }">
                      {{ record.id }}
                    </a-typography-paragraph>
                  </template>
                </a-table-column>
                <a-table-column title="文件名称" data-index="file_name" />
                <a-table-column title="大小" data-index="file_size" :width="100" />
              </template>
            </a-table>
          </div>
          <a-empty
            v-if="(!cloudListData.folder_list || !cloudListData.folder_list.length) && (!cloudListData.file_list || !cloudListData.file_list.length)"
            description="该文件夹为空"
          />
        </div>
        <a-empty v-else-if="!cloudListLoading" description="请点击&quot;获取列表&quot;按钮加载文件夹内容" />

        <div v-if="cloudAllFolders.length" class="cloud-section">
          <div class="cloud-section-title"><icon-folder /> 所有文件夹 ({{ cloudAllFolders.length }})</div>
          <a-table
            :data="cloudAllFolders"
            :pagination="false"
            size="small"
          >
            <template #columns>
              <a-table-column title="文件夹ID" data-index="folder_id" :width="200">
                <template #cell="{ record }">
                  <a-typography-paragraph copyable :style="{ marginBottom: 0 }">
                    {{ record.folder_id }}
                  </a-typography-paragraph>
                </template>
              </a-table-column>
              <a-table-column
                title="文件夹名称"
                data-index="folder_name"
                :sortable="{ sortDirections: ['ascend', 'descend'], defaultSortOrder: 'ascend' }"
              >
                <template #cell="{ record }">
                  <a-link @click="onEnterFolder(record.folder_id, record.folder_name)">{{ record.folder_name }}</a-link>
                </template>
              </a-table-column>
              <a-table-column title="系统文件夹" :width="100" align="center">
                <template #cell="{ record }">
                  <a-tag :color="record.is_system_folder === 1 ? 'blue' : 'gray'">
                    {{ record.is_system_folder === 1 ? '是' : '否' }}
                  </a-tag>
                </template>
              </a-table-column>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>

    <!-- 同步到教材弹窗 -->
    <a-modal
      v-model:visible="syncModalVisible"
      title="同步云盘文件夹到教材"
      width="520px"
      :ok-loading="syncLoading"
      ok-text="开始同步"
      @ok="onSyncCloudFolders"
    >
      <a-form :model="syncForm" layout="vertical">
        <a-form-item label="父节点ID" help="0 表示根节点，填入已有 edu_material 节点的 ID 可挂在该节点下">
          <a-input-number v-model="syncForm.pid" :min="0" style="width: 100%" placeholder="0" />
        </a-form-item>
        <a-form-item label="节点类型" required>
          <a-select v-model="syncForm.type" placeholder="请选择节点类型">
            <a-option value="CATEGORY">CATEGORY - 分类</a-option>
            <a-option value="BOOK">BOOK - 课本名字</a-option>
            <a-option value="LEVEL">LEVEL - 课本级别</a-option>
            <a-option value="UNIT">UNIT - 单元</a-option>
            <a-option value="LESSON">LESSON - 教材课节</a-option>
          </a-select>
        </a-form-item>
        <a-form-item label="重复处理">
          <a-radio-group v-model="syncForm.skipExisting">
            <a-radio :value="true">跳过已存在的（cloud_id 重复不导入）</a-radio>
            <a-radio :value="false">覆盖已存在的</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="待同步内容">
          <a-space>
            <a-tag v-if="syncFolderCount > 0">{{ syncFolderCount }} 个文件夹</a-tag>
            <a-tag v-if="syncFileCount > 0" color="green">{{ syncFileCount }} 个文件</a-tag>
            <a-tag v-if="syncFolderCount === 0 && syncFileCount === 0" color="red">暂无内容</a-tag>
          </a-space>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 文件预览模态框 -->
    <a-modal
      v-model:visible="previewVisible"
      :title="previewTitle"
      :width="1200"
      :footer="false"
      unmount-on-close
      modal-class="preview-modal"
    >
      <div style="height: 80vh; overflow: hidden; position: relative;">
        <iframe
          v-if="previewUrl"
          :src="previewUrl"
          style="width: 100%; height: calc(100% + 80px); border: none; margin-top: -80px;"
          frameborder="0"
        ></iframe>
        <a-empty v-else description="无法加载预览" />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import MaterialAddModal from './MaterialAddModal.vue'
import MaterialDetailDrawer from './MaterialDetailDrawer.vue'
import MaterialLessonModal from './MaterialLessonModal.vue'
import { type MaterialResp, type MaterialQuery, addMaterial, deleteMaterial, deleteMaterials, exportMaterial, listMaterial, listAllMaterialsForTree, syncCloudFolders, syncCloudData, syncFeishu, updateMaterial } from '@/apis/education/material'
import { type CloudListResp, type CloudFolderItem, getCloudTopFolderId, getCloudList, getCloudFolderList, renameCloudFolder, renameCloudFile, uploadCloudFile, createCloudFolder } from '@/apis/education/classinCloud'
import { createFeishuFolder, findFeishuSubFolder, renameFeishuFile } from '@/apis/education/feishu'
import { useDownload } from '@/hooks'
import { useElementSize } from '@vueuse/core'

defineOptions({ name: 'Material' })

// ===== Type helpers =====
const typeIconMap: Record<string, string> = {
  CATEGORY: 'icon-folder',
  BOOK: 'icon-book',
  LEVEL: 'icon-apps',
  UNIT: 'icon-list',
  LESSON: 'icon-play-circle',
}

const getTypeColor = (type: string) => ({
  CATEGORY: 'arcoblue', BOOK: 'green', LEVEL: 'orange', UNIT: 'purple', LESSON: 'gold'
}[type] ?? 'gray')

const getTypeLabel = (type: string) => ({
  CATEGORY: '分类', BOOK: '课本', LEVEL: '级别', UNIT: '单元', LESSON: '课节'
}[type] ?? type)

// ===== Multi-select / batch delete =====
const selectedRowKeys = ref<string[]>([])

const onBatchDelete = () => {
  const keys = [...selectedRowKeys.value]
  Modal.confirm({
    title: '确认批量删除',
    content: `确认删除所选的 ${keys.length} 条教材？`,
    onOk: async () => {
      try {
        await deleteMaterials(keys)
        Message.success(`已删除 ${keys.length} 条`)
        selectedRowKeys.value = []
        loadTree()
      } catch {
        Message.error('批量删除失败')
      }
    }
  })
}

// ===== Tree data (load all, build client-side) =====
const allMaterials = ref<MaterialResp[]>([])
const treeLoading = ref(false)

interface TreeNode { key: string; title: string; isLeaf: boolean; raw: MaterialResp; children?: TreeNode[] }

const buildTree = (items: MaterialResp[], parentId: string | number = 0): TreeNode[] =>
  items
    .filter(item => item.type !== 'LESSON')
    .filter(item => {
      const pid = item.pid
      if (parentId === 0 || String(parentId) === '0') return !pid || String(pid) === '0'
      return String(pid) === String(parentId)
    })
    .map(item => {
      const children = buildTree(items, item.id)
      return { key: item.id, title: item.name, isLeaf: children.length === 0, raw: item, children: children.length ? children : undefined }
    })

const treeNodes = computed(() => buildTree(allMaterials.value))

const expandedKeys = ref<string[]>([])

const onTreeExpand = (keys: string[]) => { expandedKeys.value = keys }

const loadTree = async () => {
  treeLoading.value = true
  try {
    const res = await listAllMaterialsForTree()
    allMaterials.value = (res.data as any)?.list ?? res.data ?? []
  } catch (e: any) {
    window.$message?.error(`加载失败: ${e?.message ?? e}`)
  } finally {
    treeLoading.value = false
  }
}

onMounted(() => loadTree())

// ===== Tree selection & breadcrumb =====
const selectedKeys = ref<string[]>([])
const breadcrumbs = ref<Array<{ id: string; name: string }>>([])

const buildPath = (id: any): Array<{ id: string; name: string }> => {
  const path: Array<{ id: string; name: string }> = []
  let current: MaterialResp | undefined = allMaterials.value.find(m => String(m.id) === String(id))
  while (current) {
    path.unshift({ id: current.id, name: current.name })
    if (!current.pid || String(current.pid) === '0') break
    current = allMaterials.value.find(m => String(m.id) === String(current!.pid))
  }
  return path
}

const onTreeNodeSelect = (keys: string[]) => {
  selectedKeys.value = keys
  if (!keys.length) return
  breadcrumbs.value = buildPath(keys[0])
  isSearchMode.value = false
  pagination.current = 1
}

const selectRoot = () => { selectedKeys.value = []; breadcrumbs.value = []; isSearchMode.value = false; pagination.current = 1 }

const selectBreadcrumb = (i: number) => {
  const crumb = breadcrumbs.value[i]
  selectedKeys.value = [crumb.id]
  breadcrumbs.value = breadcrumbs.value.slice(0, i + 1)
  isSearchMode.value = false
  pagination.current = 1
}

const enterNode = (record: MaterialResp) => {
  selectedKeys.value = [record.id]
  const idx = breadcrumbs.value.findIndex(c => c.id === record.id)
  if (idx >= 0) breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1)
  else breadcrumbs.value.push({ id: record.id, name: record.name })
  isSearchMode.value = false
  pagination.current = 1
  // Sync tree: expand all ancestors so the selected node is visible
  const pathKeys = buildPath(record.id).map(p => p.id)
  expandedKeys.value = [...new Set([...expandedKeys.value, ...pathKeys])]
}

// ===== Table data =====
const tableWrapperRef = ref<HTMLElement>()
const { height: tableWrapperHeight } = useElementSize(tableWrapperRef)

const pagination = reactive({ current: 1, pageSize: 50, total: 0, showTotal: true, showPageSize: true })
const isSearchMode = ref(false)
const searchResults = ref<MaterialResp[]>([])
const searchName = ref('')
const lastSearchName = ref('')
const searchLoading = ref(false)

const filteredItems = computed(() => {
  if (isSearchMode.value) return searchResults.value
  const pid = selectedKeys.value[0] ?? null
  const filtered = allMaterials.value.filter(item =>
    !pid ? (!item.pid || String(item.pid) === '0') : String(item.pid) === String(pid)
  )
  // 按 sort 升序，sort 相同时按名称正向排序
  return filtered.sort((a, b) => {
    const sortA = Number(a.sort) || 0
    const sortB = Number(b.sort) || 0
    if (sortA !== sortB) return sortA - sortB
    return (a.name || '').localeCompare(b.name || '', 'zh-CN')
  })
})

watch(filteredItems, (items) => { pagination.total = items.length; pagination.current = 1 }, { immediate: true })

const hasPagination = computed(() => pagination.total > pagination.pageSize)
const tablePagination = computed(() => hasPagination.value ? pagination : false)
const tableScrollY = computed(() => {
  const paginationH = hasPagination.value ? 52 : 0
  return Math.max(200, tableWrapperHeight.value - 40 - paginationH - 8)
})

const tableData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredItems.value.slice(start, start + pagination.pageSize)
})

const tableLoading = computed(() => treeLoading.value || searchLoading.value)

const onPageChange = (page: number) => { pagination.current = page }
const onPageSizeChange = (size: number) => { pagination.pageSize = size; pagination.current = 1 }

// ===== Search =====
const onSearch = async () => {
  const kw = searchName.value?.trim()
  if (!kw) { onClearSearch(); return }
  searchLoading.value = true
  isSearchMode.value = true
  lastSearchName.value = kw
  try {
    const res = await listMaterial({ name: kw, page: 1, size: 500, sort: ['sort,asc'] } as any)
    searchResults.value = res.data?.list ?? []
    pagination.current = 1
  } catch (e: any) {
    window.$message?.error(`搜索失败: ${e?.message ?? e}`)
  } finally {
    searchLoading.value = false
  }
}

const onClearSearch = () => { searchName.value = ''; lastSearchName.value = ''; isSearchMode.value = false; searchResults.value = []; pagination.current = 1 }

// ===== CRUD =====
const onSaveSuccess = () => loadTree()

const onDelete = (record: MaterialResp) => {
  Modal.confirm({
    title: '确认删除',
    content: `是否确定删除「${record.name}」？`,
    onOk: async () => {
      try { await deleteMaterial(record.id); Message.success('删除成功'); loadTree() }
      catch { Message.error('删除失败') }
    }
  })
}

const onExport = () => useDownload(() => exportMaterial({} as MaterialQuery))

const currentViewTypeOptions = computed(() => {
  const types = new Set(filteredItems.value.map(item => item.type).filter(Boolean))
  return [...types].map(type => ({ label: getTypeLabel(type), value: type }))
})

const isLessonView = computed(() => {
  // 判断当前视图是否只显示课节类型
  return filteredItems.value.length > 0 && filteredItems.value.every(item => item.type === 'LESSON')
})

const hasBookType = computed(() => {
  // 判断当前视图是否包含课本类型
  return filteredItems.value.some(item => item.type === 'BOOK')
})

const maxSortInView = computed(() => {
  const sorts = filteredItems.value.map(item => Number(item.sort)).filter(n => !isNaN(n))
  return sorts.length ? Math.max(...sorts) : 0
})

const selectedMaterial = computed(() =>
  selectedKeys.value[0] ? allMaterials.value.find(m => String(m.id) === String(selectedKeys.value[0])) : null
)

// 上传权限检查
const canUpload = computed(() => {
  const target = selectedMaterial.value
  if (!target) {
    // 如果两个开关都关闭，不允许上传
    if (!enableClassInSync.value && !enableFeishuSync.value) return false
    // 如果没有选择节点，至少需要根节点可用
    return true
  }

  // 如果 ClassIn 同步开启，需要有 cloudId
  if (enableClassInSync.value && !target.cloudId) return false

  // 如果飞书同步开启，需要有 feishuFolderToken（或可以通过 ensureFeishuFolderChain 创建）
  // 这里我们允许上传，因为 ensureFeishuFolderChain 会尝试创建
  if (enableFeishuSync.value) return true

  // 如果 ClassIn 同步开启且有 cloudId，允许上传
  if (enableClassInSync.value && target.cloudId) return true

  return false
})

const uploadWarningMessage = computed(() => {
  if (!enableClassInSync.value && !enableFeishuSync.value) {
    return '请至少开启一个同步开关（同步飞书或同步ClassIn）'
  }

  const target = selectedMaterial.value
  if (!target) {
    return '请先选择一个教材节点'
  }

  if (enableClassInSync.value && !target.cloudId) {
    return '请先选择一个关联云盘的教材节点'
  }

  return '无法上传到当前节点'
})

const MaterialAddModalRef = ref<InstanceType<typeof MaterialAddModal>>()
const onAdd = () => MaterialAddModalRef.value?.onAdd(
  currentViewTypeOptions.value,
  maxSortInView.value,
  selectedMaterial.value?.id ?? null,
  selectedMaterial.value?.cloudId ?? null,
  selectedMaterial.value?.feishuFolderToken ?? null
)
const onUpdate = (record: MaterialResp) => MaterialAddModalRef.value?.onUpdate(record.id, currentViewTypeOptions.value)

const MaterialDetailDrawerRef = ref<InstanceType<typeof MaterialDetailDrawer>>()
const onDetail = (record: MaterialResp) => MaterialDetailDrawerRef.value?.onOpen(record.id)

const MaterialLessonModalRef = ref<InstanceType<typeof MaterialLessonModal>>()
const onManageLessons = (record: MaterialResp) => MaterialLessonModalRef.value?.onOpen(record.id, record.name)

// 预览课节文件
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')

const onPreview = (record: MaterialResp) => {
  if (record.lessonUrl) {
    previewTitle.value = record.name || '文件预览'
    // 添加参数隐藏飞书文档的头部工具栏
    const url = new URL(record.lessonUrl)
    url.searchParams.set('toolbar', '0')  // 隐藏工具栏
    url.searchParams.set('navpane', '0')  // 隐藏导航面板
    previewUrl.value = url.toString()
    previewVisible.value = true
  }
}

// 云盘文件夹浏览器
const contextMaterialId = ref<number>(0)

const cloudBrowserVisible = ref(false)
const cloudFolderId = ref('')
const cloudTopIdLoading = ref(false)
const cloudListLoading = ref(false)
const cloudListData = ref<CloudListResp | null>(null)
const cloudAllFoldersLoading = ref(false)
const cloudAllFolders = ref<CloudFolderItem[]>([])

interface BreadcrumbItem { id: string; name: string }
const cloudBreadcrumbs = ref<BreadcrumbItem[]>([{ id: '', name: '根目录' }])

// ===== Inline name edit =====
const inlineEditId = ref<number | null>(null)
const inlineEditName = ref('')

const onInlineEditStart = (record: MaterialResp) => {
  inlineEditId.value = record.id
  inlineEditName.value = record.name
}

const onInlineEditSave = async (record: MaterialResp) => {
  const newName = inlineEditName.value.trim()
  if (!newName) {
    window.$message?.warning('名称不能为空')
    return
  }
  try {
    await updateMaterial({ ...record, name: newName, cloudName: newName }, String(record.id))
    record.name = newName
    inlineEditId.value = null

    // 同步到ClassIn云盘
    if (record.cloudId) {
      try {
        if (record.type === 'LESSON') {
          await renameCloudFile(record.cloudId, newName.replace(/\.[^.]+$/, ''))
        } else {
          await renameCloudFolder(record.cloudId, newName)
        }
        window.$message?.success('已保存并同步到ClassIn云盘')
      } catch {
        window.$message?.warning('已保存，但ClassIn云盘同步失败')
      }
    }

    // 同步到飞书云盘（课节使用lessonUrl，文件夹使用feishuFolderToken）
    console.log('[飞书同步] type:', record.type, 'lessonUrl:', record.lessonUrl, 'feishuFolderToken:', record.feishuFolderToken)
    let feishuToken: string | null = null

    if (record.type === 'LESSON' && record.lessonUrl) {
      // 课节：从lessonUrl提取fileToken (格式: https://ai.feishu.cn/file/{fileToken})
      const urlMatch = record.lessonUrl.match(/\/file\/([^/?]+)/)
      if (urlMatch && urlMatch[1]) {
        feishuToken = urlMatch[1]
      }
    } else if (record.feishuFolderToken) {
      // 文件夹：直接使用feishuFolderToken
      feishuToken = record.feishuFolderToken
    }

    if (feishuToken) {
      try {
        await renameFeishuFile(feishuToken, newName)
        window.$message?.success('已保存并同步到飞书')
      } catch (err) {
        console.warn('飞书同步失败', err)
        window.$message?.warning('已保存，但飞书同步失败')
      }
    }

    if (!record.cloudId && !record.lessonUrl && !record.feishuFolderToken) {
      window.$message?.success('保存成功')
    }
  } catch (e: any) {
    window.$message?.error(`保存失败: ${e?.message ?? e}`)
  }
}

const syncNamesLoading = ref(false)
const syncCloudDataLoading = ref(false)

const getAllDescendants = (nodeId: string | null): MaterialResp[] => {
  const result: MaterialResp[] = []
  const visited = new Set<string>()
  const stack: string[] = nodeId ? [nodeId] : allMaterials.value.filter(m => !m.pid || String(m.pid) === '0').map(m => m.id)
  while (stack.length) {
    const id = stack.pop()!
    if (visited.has(id)) continue
    visited.add(id)
    const children = allMaterials.value.filter(m => String(m.pid) === String(id))
    for (const child of children) {
      result.push(child)
      stack.push(child.id)
    }
  }
  return result
}

const onSyncCloudData = async () => {
  const items = filteredItems.value.filter(r => r.cloudId)
  if (!items.length) {
    Message.warning('当前页面没有带云盘ID的记录')
    return
  }
  Modal.confirm({
    title: '同步ClassIn数据',
    content: `将从ClassIn云盘同步当前页面 ${items.length} 条记录的子节点到数据库，是否继续？`,
    onOk: async () => {
      syncCloudDataLoading.value = true
      try {
        const ids = items.map(r => r.id)
        const res = await syncCloudData(ids)
        const count = res.data ?? 0
        await loadTree()
        Message.success(`同步完成，新增/更新 ${count} 条记录`)
      } catch (e: any) {
        Message.error(`同步失败: ${e?.message ?? e}`)
      } finally {
        syncCloudDataLoading.value = false
      }
    }
  })
}

const onSyncNamesToCloud = async () => {
  const items = tableData.value.filter(r => r.cloudId)
  if (!items.length) {
    window.$message?.warning('当前页面没有带云盘ID的记录')
    return
  }
  Modal.confirm({
    title: '同步名称到云盘',
    content: `将把当前页面 ${items.length} 条记录的名称同步到 ClassIn 云盘，是否继续？`,
    onOk: async () => {
      syncNamesLoading.value = true
      let success = 0, fail = 0
      for (const item of items) {
        try {
          if (item.type === 'LESSON') {
            await renameCloudFile(item.cloudId, item.name.replace(/\.[^.]+$/, ''))
          } else {
            await renameCloudFolder(item.cloudId, item.name)
          }
          success++
        } catch {
          fail++
        }
      }
      syncNamesLoading.value = false
      Modal.success({
        title: '同步完成',
        content: `成功 ${success} 条${fail ? `，失败 ${fail} 条` : ''}`,
        okText: '知道了'
      })
    }
  })
}

// 同步飞书弹窗状态
const syncFeishuModalVisible = ref(false)
const syncFeishuRecord = ref<MaterialResp | null>(null)
const syncFeishuRecursive = ref(false)

const onSyncFeishu = (record: MaterialResp) => {
  syncFeishuRecord.value = record
  syncFeishuRecursive.value = false
  syncFeishuModalVisible.value = true
}

const onSyncFeishuConfirm = async () => {
  if (!syncFeishuRecord.value) return
  const loading = Message.loading({ content: '正在同步...', duration: 0 })
  try {
    const { data } = await syncFeishu(syncFeishuRecord.value.id, syncFeishuRecursive.value)
    loading.close()
    syncFeishuModalVisible.value = false
    const failedMsg = data.failed > 0 ? `\n失败：${data.failed} 个` : ''
    const detailMsg = data.details && data.details.length > 0 ? `\n\n失败详情：\n${data.details.slice(0, 5).join('\n')}${data.details.length > 5 ? `\n...还有 ${data.details.length - 5} 条` : ''}` : ''
    Modal.success({
      title: '同步完成',
      content: `总计：${data.total} 个\n成功：${data.success} 个${failedMsg}${detailMsg}`,
      okText: '知道了'
    })
    loadTree()
  } catch (e: any) {
    loading.close()
    Message.error(e.message || '同步失败')
  }
}

const onOpenCloudBrowser = () => {
  cloudFolderId.value = '3847128613'
  cloudListData.value = null
  cloudAllFolders.value = []
  cloudBreadcrumbs.value = [{ id: '', name: '根目录' }]
  cloudBrowserVisible.value = true
  nextTick(() => onFetchCloudList())
}

const onOpenCloudBrowserById = (record: MaterialResp) => {
  contextMaterialId.value = Number(record.id)
  cloudFolderId.value = record.cloudId || '3847128613'
  cloudListData.value = null
  cloudAllFolders.value = []
  cloudBreadcrumbs.value = [{ id: record.cloudId, name: record.name }]
  cloudBrowserVisible.value = true
  nextTick(() => onFetchCloudList())
}

const onFetchAllFolders = async () => {
  cloudAllFoldersLoading.value = true
  try {
    const res = await getCloudFolderList()
    cloudAllFolders.value = res.data
  } catch (e: any) {
    window.$message?.error(`获取文件夹列表失败: ${e?.message ?? e}`)
  } finally {
    cloudAllFoldersLoading.value = false
  }
}

const onFetchTopFolderId = async () => {
  cloudTopIdLoading.value = true
  try {
    const res = await getCloudTopFolderId()
    cloudFolderId.value = res.data
    window.$message?.success(`顶级文件夹ID已填入: ${res.data}`)
  } catch (e: any) {
    window.$message?.error(`获取失败: ${e?.message ?? e}`)
  } finally {
    cloudTopIdLoading.value = false
  }
}

const onFetchCloudList = async () => {
  cloudListLoading.value = true
  try {
    const res = await getCloudList(cloudFolderId.value || undefined)
    cloudListData.value = res.data
  } catch (e: any) {
    window.$message?.error(`获取文件夹列表失败: ${e?.message ?? e}`)
  } finally {
    cloudListLoading.value = false
  }
}

const onEnterFolder = (folderId: string, folderName: string) => {
  cloudBreadcrumbs.value.push({ id: folderId, name: folderName })
  cloudFolderId.value = folderId
  cloudListData.value = null
  onFetchCloudList()
}

const onBackFolder = () => {
  if (cloudBreadcrumbs.value.length > 1) {
    cloudBreadcrumbs.value.pop()
    const current = cloudBreadcrumbs.value[cloudBreadcrumbs.value.length - 1]
    cloudFolderId.value = current.id
    cloudListData.value = null
    onFetchCloudList()
  }
}

const onClickBreadcrumb = (index: number) => {
  cloudBreadcrumbs.value = cloudBreadcrumbs.value.slice(0, index + 1)
  const current = cloudBreadcrumbs.value[cloudBreadcrumbs.value.length - 1]
  cloudFolderId.value = current.id
  cloudListData.value = null
  onFetchCloudList()
}

// 同步云盘文件夹到教材表
const syncModalVisible = ref(false)
const syncLoading = ref(false)
const syncForm = reactive({ pid: 0, type: 'LEVEL', skipExisting: true })
const syncFolderCount = computed(() => cloudListData.value?.folder_list?.length ?? 0)
const syncFileCount = computed(() => cloudListData.value?.file_list?.length ?? 0)

const onOpenSyncModal = () => {
  if (contextMaterialId.value) syncForm.pid = contextMaterialId.value
  syncModalVisible.value = true
}

// ===== Drag & Drop Upload =====
interface UploadItem { id: number; name: string; status: 'uploading' | 'done' | 'error'; error?: string }
const isDragging = ref(false)
const dragCounter = ref(0)
const uploadQueue = ref<UploadItem[]>([])
const batchTotal = ref(0)
const batchProcessed = ref(0)
let _uploadIdSeq = 0

// 飞书同步开关：开启时飞书优先（飞书失败则整体失败）；关闭时仅上传 ClassIn
const enableFeishuSync = ref(true)
// ClassIn 同步开关：控制是否传递到 ClassIn 中
const enableClassInSync = ref(true)

const onDragEnter = (e: DragEvent) => {
  if (!e.dataTransfer?.types.includes('Files')) return
  dragCounter.value++
  isDragging.value = true
}
const onDragLeave = () => {
  dragCounter.value--
  if (dragCounter.value <= 0) { dragCounter.value = 0; isDragging.value = false }
}
const SKIP_NAMES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini', '__MACOSX', '.localized'])
const shouldSkipEntry = (name: string) => name.startsWith('.') || SKIP_NAMES.has(name)

const countEntries = async (entry: FileSystemEntry): Promise<number> => {
  if (shouldSkipEntry(entry.name)) return 0
  if (entry.isFile) return 1
  const children = await readAllDirEntries((entry as FileSystemDirectoryEntry).createReader())
  let n = 1
  for (const child of children) n += await countEntries(child)
  return n
}

const extractSortFromName = (name: string): number => {
  const m = name.match(/(\d+)/)
  if (m) { const n = parseInt(m[1], 10); return isNaN(n) ? 999 : n }
  return 999
}

const readAllDirEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> =>
  new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = []
    const next = () => reader.readEntries(batch => { if (!batch.length) { resolve(all) } else { all.push(...batch); next() } }, reject)
    next()
  })

const processEntry = async (entry: FileSystemEntry, parentMatId: number | string, parentCloudFolderId: string, parentFeishuFolderToken?: string | null): Promise<void> => {
  if (shouldSkipEntry(entry.name)) return
  if (entry.isFile) {
    const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej))
    const item: UploadItem = { id: ++_uploadIdSeq, name: entry.name, status: 'uploading' }
    uploadQueue.value.unshift(item)
    try {
      let feishuFileToken: string | null = null
      let lessonUrl: string | null = null

      if (enableFeishuSync.value) {
        // 飞书优先：先上传飞书，失败则记录到数据库但标记飞书同步失败
        if (!parentFeishuFolderToken) {
          throw new Error('父节点缺少飞书文件夹 token，无法同步飞书')
        }
        const { data: uploadResult } = await uploadCloudFile(parentCloudFolderId, file, parentFeishuFolderToken, enableClassInSync.value)
        feishuFileToken = uploadResult.feishuFileToken || null
        lessonUrl = uploadResult.lessonUrl || null
        const fileId = uploadResult.classinFileId
        const name = file.name.replace(/\.[^.]*$/, '')
        const sort = extractSortFromName(file.name)
        // 飞书上传失败时仍保存数据库记录，feishuFolderToken 为 null 表示待同步
        await addMaterial({ pid: Number(parentMatId), type: 'LESSON', name, cloudId: fileId, cloudName: file.name, lessonUrl, feishuFolderToken: feishuFileToken, isShow: true, sort })
      } else {
        // 仅 ClassIn 模式：忽略飞书
        const { data: uploadResult } = await uploadCloudFile(parentCloudFolderId, file, undefined, enableClassInSync.value)
        const fileId = uploadResult.classinFileId
        const name = file.name.replace(/\.[^.]*$/, '')
        const sort = extractSortFromName(file.name)
        await addMaterial({ pid: Number(parentMatId), type: 'LESSON', name, cloudId: fileId, cloudName: file.name, isShow: true, sort })
      }

      item.status = 'done'
    } catch (err: any) { item.status = 'error'; item.error = err?.message ?? '上传失败' }
    batchProcessed.value++
  } else if (entry.isDirectory) {
    const item: UploadItem = { id: ++_uploadIdSeq, name: entry.name + '/', status: 'uploading' }
    uploadQueue.value.unshift(item)
    try {
      let folderId: string | null = null
      if (enableClassInSync.value) {
        const { data: folderIdData } = await createCloudFolder(parentCloudFolderId, entry.name, enableClassInSync.value)
        folderId = folderIdData
      }
      const sort = extractSortFromName(entry.name)

      let feishuFolderToken: string | null = null
      if (enableFeishuSync.value && parentFeishuFolderToken) {
        try {
          const { data: feishuToken } = await createFeishuFolder(parentFeishuFolderToken, entry.name)
          feishuFolderToken = feishuToken
        } catch (feishuErr) {
          console.warn('飞书文件夹创建失败:', feishuErr)
        }
      }

      const { data: newIdResp } = await addMaterial({ pid: Number(parentMatId), type: 'UNIT', name: entry.name, cloudId: folderId, cloudName: entry.name, feishuFolderToken, isShow: true, sort })
      item.status = 'done'
      batchProcessed.value++
      const children = await readAllDirEntries((entry as FileSystemDirectoryEntry).createReader())
      for (const child of children) {
        await processEntry(child, newIdResp?.id ?? parentMatId, folderId ?? parentCloudFolderId, feishuFolderToken)
      }
    } catch (err: any) { item.status = 'error'; item.error = err?.message ?? '创建文件夹失败'; batchProcessed.value++ }
  }
}

const onFileDrop = async (e: DragEvent) => {
  dragCounter.value = 0
  isDragging.value = false

  // 检查是否可以上传
  if (!canUpload.value) {
    Message.warning(uploadWarningMessage.value)
    return
  }

  const target = selectedMaterial.value
  if (!target) {
    Message.warning('请先选择一个教材节点')
    return
  }

  // 如果 ClassIn 同步开启，必须有 cloudId
  if (enableClassInSync.value && !target.cloudId) {
    Message.warning('请先选择一个关联云盘的教材节点')
    return
  }

  const items = Array.from(e.dataTransfer?.items ?? [])
  const entries = items.map(i => i.webkitGetAsEntry?.()).filter((x): x is FileSystemEntry => !!x)
  if (!entries.length) return
  uploadQueue.value = []
  batchProcessed.value = 0

  // 立即添加一个"准备中"的占位项，让用户知道系统正在处理
  const preparingItem: UploadItem = {
    id: ++_uploadIdSeq,
    name: '正在准备上传...',
    status: 'uploading'
  }
  uploadQueue.value.unshift(preparingItem)

  // 计算文件总数
  let total = 0
  for (const entry of entries) total += await countEntries(entry)
  batchTotal.value = total

  // 飞书开启时，在后台确保目标节点的飞书文件夹链完整
  let feishuFolderToken: string | null = null
  if (enableFeishuSync.value) {
    preparingItem.name = '正在检查飞书文件夹...'
    feishuFolderToken = await ensureFeishuFolderChain(target)
    if (!feishuFolderToken) {
      preparingItem.status = 'error'
      preparingItem.error = '飞书文件夹链补全失败'
      Message.warning('飞书文件夹链补全失败，请关闭「同步飞书」开关后仅上传 ClassIn')
      return
    }
  }

  // 移除准备项
  const prepIndex = uploadQueue.value.findIndex(i => i.id === preparingItem.id)
  if (prepIndex !== -1) {
    uploadQueue.value.splice(prepIndex, 1)
  }

  for (const entry of entries) {
    await processEntry(entry, target.id, target.cloudId || '', feishuFolderToken)
  }
  if (uploadQueue.value.some(i => i.status === 'done')) { loadTree() }
}

/**
 * 确保从根到目标节点的飞书文件夹链完整。
 * 找到路径中最深的已有 feishuFolderToken 的祖先，从那里开始向下逐层创建缺失的飞书文件夹并回写。
 * 返回目标节点最终的 feishuFolderToken（创建失败则返回 null）。
 */
const ensureFeishuFolderChain = async (target: MaterialResp): Promise<string | null> => {
  // 如果目标节点本身已有 token，直接返回
  if (target.feishuFolderToken) return target.feishuFolderToken

  // 构建从根到目标节点的路径（含目标节点）
  const path: MaterialResp[] = []
  let current: MaterialResp | undefined = target
  while (current) {
    path.unshift(current)
    if (!current.pid || String(current.pid) === '0') break
    current = allMaterials.value.find(m => String(m.id) === String(current!.pid))
  }

  // 找到路径中最深的已有 feishuFolderToken 的节点
  let anchorIndex = -1
  let anchorToken: string | null = null
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].feishuFolderToken) {
      anchorIndex = i
      anchorToken = path[i].feishuFolderToken
      break
    }
  }

  // 从锚点的下一个节点开始，逐层创建飞书文件夹并回写
  let parentToken = anchorToken
  for (let i = anchorIndex + 1; i < path.length; i++) {
    const node = path[i]

    // 如果当前节点已经有 token，直接使用它作为父 token，不重新创建
    if (node.feishuFolderToken) {
      parentToken = node.feishuFolderToken
      continue
    }

    try {
      const { data: newToken } = await createFeishuFolder(parentToken, node.name)
      if (newToken) {
        // 回写到数据库
        await updateMaterial({
          pid: node.pid,
          type: node.type,
          name: node.name,
          code: node.code,
          coverImg: node.coverImg,
          description: node.description,
          isShow: node.isShow,
          sort: node.sort,
          feishuFolderToken: newToken
        } as any, String(node.id))
        // 同步更新内存中的节点，避免后续同批次上传重复创建
        const inMem = allMaterials.value.find(m => String(m.id) === String(node.id))
        if (inMem) inMem.feishuFolderToken = newToken
        parentToken = newToken
      } else {
        console.warn('飞书文件夹创建返回空token，节点:', node.name)
        return null
      }
    } catch (err) {
      console.warn('飞书补链失败，节点:', node.name, err)
      return null
    }
  }

  return parentToken
}

const onSyncCloudFolders = async () => {
  if (!syncForm.type) {
    window.$message?.warning('请选择节点类型')
    return
  }
  const folders = (cloudListData.value?.folder_list ?? []).map((f) => ({
    folderId: f.folder_id,
    folderName: f.folder_name
  }))
  const files = (cloudListData.value?.file_list ?? []).map((f) => ({
    fileId: f.id,
    fileName: f.file_name
  }))
  if (!folders.length && !files.length) {
    window.$message?.warning('当前列表没有可同步的内容')
    return
  }
  syncLoading.value = true
  try {
    const res = await syncCloudFolders({ ...syncForm, folders, files })
    syncModalVisible.value = false
    loadTree()
    Modal.success({
      title: '同步完成',
      content: `本次共新增 ${res.data} 条教材记录，教材目录已自动刷新。`,
      okText: '知道了'
    })
  } catch (e: any) {
    Message.error(`同步失败: ${e?.message ?? e}`)
  } finally {
    syncLoading.value = false
  }
}
</script>

<style scoped lang="scss">
.material-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  padding: 16px;
  box-sizing: border-box;

  .material-header {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: auto;
    }
  }

  .material-body {
    display: flex;
    gap: 12px;
    flex: 1;
    overflow: hidden;
    min-height: 0;

    .tree-sidebar {
      width: 260px;
      flex-shrink: 0;
      border: 1px solid var(--color-border-2);
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      background: var(--color-bg-2);

      .sidebar-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-bottom: 1px solid var(--color-border-2);
        flex-shrink: 0;
      }

      .sidebar-title {
        font-weight: 600;
        font-size: 13px;
      }

      .sidebar-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 8px 4px;
      }
    }

    .content-area {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 0;
      overflow: hidden;

      .content-top {
        display: flex;
        align-items: center;
        padding: 6px 0;
        flex-shrink: 0;
      }

      .drop-overlay {
        position: absolute;
        inset: 0;
        z-index: 100;
        background: rgba(22, 93, 255, 0.07);
        border: 2px dashed var(--color-primary-6);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;

        .drop-overlay-inner {
          text-align: center;
          color: var(--color-primary-6);
          p { margin-top: 12px; font-size: 14px; font-weight: 500; }
        }
      }

      .upload-queue {
        flex-shrink: 0;
        border: 1px solid var(--color-border-2);
        border-radius: 4px;
        padding: 6px 12px;
        max-height: 130px;
        overflow-y: auto;
        background: var(--color-bg-2);

        .upload-queue-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
          font-size: 12px;
          color: var(--color-text-2);
        }

        .upload-queue-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 2px 0;
          font-size: 13px;

          .upload-item-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .upload-item-error {
            color: #f53f3f;
            font-size: 12px;
            flex-shrink: 0;
          }
        }
      }
    }
  }
}

.tree-node-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;

  .tree-node-icon {
    font-size: 13px;
  }
}

.node-name {
  display: inline-flex;
  align-items: center;
}

.cloud-browser {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .cloud-browser-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .cloud-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .cloud-breadcrumb {
    padding: 6px 8px;
    background: var(--color-fill-2);
    border-radius: 4px;
  }

  .cloud-section {
    .cloud-section-title {
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--color-text-1);
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}
</style>
