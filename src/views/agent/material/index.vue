<template>
  <div class="agent-material-page">
    <div class="material-header">
      <a-input-search
        v-model="searchName"
        placeholder="搜索教材名称..."
        allow-clear
        style="width: 260px"
        @search="onSearch"
        @clear="onClearSearch"
        @press-enter="onSearch"
      />
      <div class="header-actions">
        <a-button type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>新增
        </a-button>
        <a-button v-if="selectedRowKeys.length" status="danger" @click="onBatchDelete">
          <template #icon><icon-delete /></template>批量删除 ({{ selectedRowKeys.length }})
        </a-button>
      </div>
    </div>

    <div class="material-body">
      <!-- 左侧树形目录 -->
      <div class="tree-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">教材目录</span>
          <a-button size="mini" shape="circle" :loading="treeLoading" @click="loadData">
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
            @expand="(keys: string[]) => { expandedKeys = keys }"
          >
            <template #title="{ title, raw }">
              <span class="tree-node-item">
                <component :is="typeIconMap[raw?.type] || 'icon-file'" class="tree-node-icon" />
                {{ title }}
              </span>
            </template>
          </a-tree>
          <div v-else-if="treeLoading" style="padding: 16px">
            <a-skeleton :animation="true"><a-skeleton-line :rows="5" /></a-skeleton>
          </div>
          <a-empty v-else :image-size="60" description="暂无教材数据" style="margin-top: 40px" />
        </div>
      </div>

      <!-- 右侧表格 -->
      <div class="content-area">
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

        <a-table
          :data="tableData"
          :loading="tableLoading"
          row-key="id"
          :row-selection="{ type: 'checkbox', showCheckedAll: true, selectedRowKeys: selectedRowKeys }"
          @select="(rowKeys: string[]) => (selectedRowKeys = rowKeys)"
          @select-all="(checked: boolean) => (selectedRowKeys = checked ? tableData.map((r: any) => r.id) : [])"
          :pagination="tablePagination"
          :scroll="{ x: 800 }"
          @page-change="(page: number) => { pagination.current = page }"
          @page-size-change="(size: number) => { pagination.pageSize = size; pagination.current = 1 }"
        >
          <template #columns>
            <a-table-column title="名称" data-index="name" :min-width="200">
              <template #cell="{ record }">
                <span style="display:flex;align-items:center;gap:6px">
                  <component
                    :is="typeIconMap[record.type] || 'icon-file'"
                    :style="{ color: getTypeColor(record.type), fontSize: '14px', flexShrink: 0 }"
                  />
                  <a-link v-if="record.type !== 'LESSON'" @click="enterNode(record)">{{ record.name }}</a-link>
                  <span v-else>{{ record.name }}</span>
                </span>
              </template>
            </a-table-column>
            <a-table-column title="编码" data-index="code" :width="140" />
            <a-table-column title="类型" data-index="type" :width="100">
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
            <a-table-column title="操作" :width="160" fixed="right" align="center">
              <template #cell="{ record }">
                <a-space>
                  <a-link @click="onUpdate(record)"><icon-edit /> 编辑</a-link>
                  <a-link status="danger" @click="onDelete(record)"><icon-delete /> 删除</a-link>
                </a-space>
              </template>
            </a-table-column>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <a-modal
      v-model:visible="modalVisible"
      :title="modalTitle"
      :mask-closable="false"
      :width="520"
      draggable
      @before-ok="onSave"
      @close="resetModal"
    >
      <a-form ref="formRef" :model="form" layout="vertical" auto-label-width>
        <a-form-item label="名称" field="name" :rules="[{ required: true, message: '名称不能为空' }]">
          <a-input v-model="form.name" placeholder="请输入名称" allow-clear />
        </a-form-item>
        <a-form-item label="类型" field="type" :rules="[{ required: true, message: '请选择类型' }]">
          <a-select v-model="form.type" placeholder="请选择节点类型" allow-clear>
            <a-option v-for="opt in typeSelectOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-option>
          </a-select>
        </a-form-item>
        <a-form-item v-if="form.type === 'BOOK'" label="编码" field="code">
          <a-input v-model="form.code" placeholder="课本编码，如 EFK_K1" allow-clear />
        </a-form-item>
        <a-form-item v-if="form.type === 'BOOK'" label="描述" field="description">
          <a-textarea v-model="form.description" placeholder="教材描述（可选）" :max-length="500" show-word-limit />
        </a-form-item>
        <a-form-item label="是否展示" field="isShow">
          <a-radio-group v-model="form.isShow">
            <a-radio :value="true">展示</a-radio>
            <a-radio :value="false">不展示</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="排序" field="sort">
          <a-input-number v-model="form.sort" :min="0" :max="9999" style="width: 160px" placeholder="数字越小越靠前" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import type { FormInstance } from '@arco-design/web-vue'
import {
  type AgentMaterialResp,
  listAllAgentMaterials,
  addAgentMaterial,
  updateAgentMaterial,
  deleteAgentMaterials,
  getAgentMaterial
} from '@/apis/agent/material'

defineOptions({ name: 'AgentMaterial' })

// ===== 类型辅助 =====
const typeIconMap: Record<string, string> = {
  CATEGORY: 'icon-folder',
  BOOK: 'icon-book',
  LEVEL: 'icon-apps',
  UNIT: 'icon-list',
  LESSON: 'icon-play-circle',
}

const getTypeColor = (type: string) =>
  ({ CATEGORY: 'arcoblue', BOOK: 'green', LEVEL: 'orange', UNIT: 'purple', LESSON: 'gold' }[type] ?? 'gray')

const getTypeLabel = (type: string) =>
  ({ CATEGORY: '分类', BOOK: '课本', LEVEL: '级别', UNIT: '单元', LESSON: '课节' }[type] ?? type)

const typeSelectOptions = [
  { label: '分类 (CATEGORY)', value: 'CATEGORY' },
  { label: '课本 (BOOK)', value: 'BOOK' },
  { label: '级别 (LEVEL)', value: 'LEVEL' },
  { label: '单元 (UNIT)', value: 'UNIT' },
  { label: '课节 (LESSON)', value: 'LESSON' },
]

// ===== 数据加载 =====
const allMaterials = ref<AgentMaterialResp[]>([])
const treeLoading = ref(false)

const loadData = async () => {
  treeLoading.value = true
  try {
    const res = await listAllAgentMaterials()
    allMaterials.value = (res.data as any)?.list ?? res.data ?? []
  } catch (e: any) {
    window.$message?.error(`加载失败: ${e?.message ?? e}`)
  } finally {
    treeLoading.value = false
  }
}

onMounted(() => loadData())

// ===== 树形结构 =====
interface TreeNode { key: string; title: string; isLeaf: boolean; raw: AgentMaterialResp; children?: TreeNode[] }

const buildTree = (items: AgentMaterialResp[], parentId: string | number = 0): TreeNode[] =>
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
const selectedKeys = ref<string[]>([])
const breadcrumbs = ref<Array<{ id: string; name: string }>>([])

const buildPath = (id: any): Array<{ id: string; name: string }> => {
  const path: Array<{ id: string; name: string }> = []
  let current: AgentMaterialResp | undefined = allMaterials.value.find(m => String(m.id) === String(id))
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

const enterNode = (record: AgentMaterialResp) => {
  selectedKeys.value = [record.id]
  const idx = breadcrumbs.value.findIndex(c => c.id === record.id)
  if (idx >= 0) breadcrumbs.value = breadcrumbs.value.slice(0, idx + 1)
  else breadcrumbs.value.push({ id: record.id, name: record.name })
  isSearchMode.value = false
  pagination.current = 1
  const pathKeys = buildPath(record.id).map(p => p.id)
  expandedKeys.value = [...new Set([...expandedKeys.value, ...pathKeys])]
}

// ===== 表格数据 =====
const pagination = reactive({ current: 1, pageSize: 50, total: 0, showTotal: true, showPageSize: true })
const isSearchMode = ref(false)
const searchResults = ref<AgentMaterialResp[]>([])
const searchName = ref('')
const lastSearchName = ref('')

const filteredItems = computed(() => {
  if (isSearchMode.value) return searchResults.value
  const pid = selectedKeys.value[0] ?? null
  return allMaterials.value.filter(item =>
    !pid ? (!item.pid || String(item.pid) === '0') : String(item.pid) === String(pid)
  )
})

watch(filteredItems, (items) => { pagination.total = items.length; pagination.current = 1 }, { immediate: true })

const tableData = computed(() => {
  const start = (pagination.current - 1) * pagination.pageSize
  return filteredItems.value.slice(start, start + pagination.pageSize)
})

const hasPagination = computed(() => pagination.total > pagination.pageSize)
const tablePagination = computed(() => hasPagination.value ? pagination : false)
const tableLoading = computed(() => treeLoading.value)

// ===== 搜索 =====
const onSearch = () => {
  const kw = searchName.value?.trim()
  if (!kw) { onClearSearch(); return }
  isSearchMode.value = true
  lastSearchName.value = kw
  searchResults.value = allMaterials.value.filter(m => m.name?.includes(kw))
  pagination.current = 1
}

const onClearSearch = () => { searchName.value = ''; lastSearchName.value = ''; isSearchMode.value = false; searchResults.value = []; pagination.current = 1 }

// ===== 批量删除 =====
const selectedRowKeys = ref<string[]>([])

const onBatchDelete = () => {
  const keys = [...selectedRowKeys.value]
  Modal.confirm({
    title: '确认批量删除',
    content: `确认删除所选的 ${keys.length} 条教材？`,
    onOk: async () => {
      try {
        await deleteAgentMaterials(keys)
        Message.success(`已删除 ${keys.length} 条`)
        selectedRowKeys.value = []
        loadData()
      } catch {
        Message.error('批量删除失败')
      }
    }
  })
}

// ===== 删除单条 =====
const onDelete = (record: AgentMaterialResp) => {
  Modal.confirm({
    title: '确认删除',
    content: `是否确定删除「${record.name}」？`,
    onOk: async () => {
      try {
        await deleteAgentMaterials([record.id])
        Message.success('删除成功')
        loadData()
      } catch {
        Message.error('删除失败')
      }
    }
  })
}

// ===== 新增/编辑弹窗 =====
const modalVisible = ref(false)
const editingId = ref<string>('')
const modalTitle = computed(() => editingId.value ? '修改教材节点' : '新增教材节点')
const formRef = ref<FormInstance>()

const form = reactive({
  pid: 0 as number,
  type: '',
  name: '',
  code: '',
  description: '',
  isShow: true,
  sort: 1,
})

const resetModal = () => {
  formRef.value?.resetFields()
  editingId.value = ''
  Object.assign(form, { pid: 0, type: '', name: '', code: '', description: '', isShow: true, sort: 1 })
}

const selectedMaterial = computed(() =>
  selectedKeys.value[0] ? allMaterials.value.find(m => String(m.id) === String(selectedKeys.value[0])) : null
)

const maxSortInView = computed(() => {
  const sorts = filteredItems.value.map(item => Number(item.sort)).filter(n => !isNaN(n))
  return sorts.length ? Math.max(...sorts) : 0
})

const onAdd = () => {
  resetModal()
  form.pid = selectedMaterial.value ? Number(selectedMaterial.value.id) : 0
  form.sort = maxSortInView.value + 1
  modalVisible.value = true
}

const onUpdate = async (record: AgentMaterialResp) => {
  resetModal()
  editingId.value = record.id
  try {
    const { data } = await getAgentMaterial(record.id)
    Object.assign(form, {
      pid: Number((data as any).pid) || 0,
      type: (data as any).type ?? '',
      name: (data as any).name ?? '',
      code: (data as any).code ?? '',
      description: (data as any).description ?? '',
      isShow: (data as any).isShow !== false,
      sort: (data as any).sort ?? 1,
    })
  } catch {
    Object.assign(form, {
      pid: Number(record.pid) || 0,
      type: record.type,
      name: record.name,
      code: record.code ?? '',
      description: record.description ?? '',
      isShow: record.isShow !== false,
      sort: record.sort ?? 1,
    })
  }
  modalVisible.value = true
}

const onSave = async () => {
  try {
    const errors = await formRef.value?.validate()
    if (errors) return false
    const payload = {
      pid: form.pid || null,
      type: form.type,
      name: form.name,
      code: form.code || undefined,
      description: form.description || undefined,
      isShow: form.isShow,
      sort: form.sort,
    }
    if (editingId.value) {
      await updateAgentMaterial(payload, editingId.value)
      Message.success('修改成功')
    } else {
      await addAgentMaterial(payload)
      Message.success('新增成功')
    }
    loadData()
    return true
  } catch {
    return false
  }
}
</script>

<style scoped lang="scss">
.agent-material-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
  padding: 0;
}

.material-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 4px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.material-body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 12px;
  overflow: hidden;
}

.tree-sidebar {
  width: 240px;
  min-width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-1);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border-2);
  font-weight: 500;
  font-size: 13px;
  color: var(--color-text-1);
}

.sidebar-title {
  font-weight: 600;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 4px;
}

.tree-node-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}

.tree-node-icon {
  font-size: 14px;
  color: var(--color-text-3);
}

.content-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-1);
  overflow: hidden;
  padding: 12px;
  gap: 10px;
}

.content-top {
  display: flex;
  align-items: center;
  min-height: 28px;
  flex-shrink: 0;
}
</style>
