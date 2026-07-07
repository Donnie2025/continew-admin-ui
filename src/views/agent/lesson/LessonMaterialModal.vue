<template>
  <a-modal
    v-model:visible="visible"
    :title="`设置教材 - ${lessonName}`"
    :width="680"
    :mask-closable="false"
    :esc-to-close="false"
    :footer="false"
    @close="handleCancel"
  >
    <!-- 当前教材 -->
    <div class="current-material">
      <span class="label">当前教材：</span>
      <template v-if="currentMaterialName">
        <a-tag color="arcoblue">{{ currentMaterialName }}</a-tag>
        <a-link status="danger" style="margin-left:8px" @click="handleClear">清除</a-link>
      </template>
      <span v-else style="color:#999">未设置</span>
    </div>

    <!-- 面包屑导航 -->
    <div v-if="breadcrumbs.length > 0" class="breadcrumb">
      <a-link @click="handleBreadcrumbClick(-1)">根目录</a-link>
      <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
        <icon-right style="margin: 0 4px; font-size: 12px; color: var(--color-text-3)" />
        <a-link @click="handleBreadcrumbClick(index)">{{ crumb.name }}</a-link>
      </template>
    </div>

    <!-- 搜索 -->
    <a-input-search
      v-model="searchKeyword"
      placeholder="搜索教材名称"
      allow-clear
      style="margin-bottom: 12px"
    />

    <!-- 教材列表 -->
    <a-spin :loading="loading" style="width:100%">
      <a-empty v-if="!loading && filteredMaterials.length === 0" description="暂无可选教材" />
      <div v-else class="material-list">
        <div
          v-for="item in filteredMaterials"
          :key="item.id"
          class="material-item"
          :class="{
            'is-selected': selectedId === item.id,
            'is-folder': item.type !== 'LESSON'
          }"
          @click="handleItemClick(item)"
        >
          <div class="item-content">
            <icon-folder v-if="item.type !== 'LESSON'" class="folder-icon" />
            <icon-file v-else class="file-icon" />
            <span class="material-name">{{ item.name }}</span>
            <a-tag v-if="item.type !== 'LESSON'" size="small" style="margin-left: 8px">{{ getTypeLabel(item.type) }}</a-tag>
          </div>
          <div class="item-actions">
            <icon-check v-if="selectedId === item.id && item.type === 'LESSON'" class="check-icon" />
            <icon-right v-if="item.type !== 'LESSON'" class="arrow-icon" />
          </div>
        </div>
      </div>
    </a-spin>

    <!-- 底部按钮 -->
    <div class="modal-footer">
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" :loading="saving" :disabled="!selectedId || selectedType !== 'LESSON'" @click="handleSave">确定</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { IconCheck, IconFolder, IconFile, IconRight } from '@arco-design/web-vue/es/icon'
import { listMaterial, type MaterialResp } from '@/apis/education/material'
import { getCourseMaterialId, setLessonMaterial } from '@/apis/agent/lesson'

const emit = defineEmits<{ saveSuccess: [] }>()

const visible = ref(false)
const loading = ref(false)
const saving = ref(false)
const lessonId = ref('')
const lessonName = ref('')
const courseId = ref('')
const currentMaterialName = ref<string | null>(null)
const selectedId = ref<string | null>(null)
const selectedName = ref<string | null>(null)
const selectedType = ref<string | null>(null)
const searchKeyword = ref('')
const allMaterials = ref<MaterialResp[]>([])
const currentPid = ref<string | null>(null)
const rootPid = ref<string | null>(null) // 保存根目录的 pid
const breadcrumbs = ref<Array<{ id: string; name: string }>>([])

const filteredMaterials = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  return allMaterials.value.filter(m => !kw || m.name.toLowerCase().includes(kw))
})

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    CATEGORY: '分类',
    BOOK: '课本',
    LEVEL: '级别',
    UNIT: '单元',
    LESSON: '课节',
  }
  return map[type] || type
}

const handleItemClick = async (item: MaterialResp) => {
  if (item.type === 'LESSON') {
    // 如果是 LESSON 类型，直接选中
    selectedId.value = item.id
    selectedName.value = item.name
    selectedType.value = item.type
  } else {
    // 如果不是 LESSON，进入下一层
    breadcrumbs.value.push({ id: item.id, name: item.name })
    currentPid.value = item.id
    await loadMaterials(item.id)
  }
}

const handleBreadcrumbClick = async (index: number) => {
  if (index === -1) {
    // 返回根目录
    breadcrumbs.value = []
    currentPid.value = rootPid.value
    await loadMaterials(rootPid.value)
  } else {
    // 返回到指定层级
    const targetCrumb = breadcrumbs.value[index]
    breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
    currentPid.value = targetCrumb.id
    await loadMaterials(targetCrumb.id)
  }
}

const loadMaterials = async (pid: string | null) => {
  if (!pid) {
    // 加载根目录（课程的 materialId）
    try {
      const pidRes = await getCourseMaterialId(courseId.value)
      pid = (pidRes.data as any) ?? null
      if (!pid) {
        allMaterials.value = []
        return
      }
      rootPid.value = pid // 保存根 pid
    } catch {
      allMaterials.value = []
      return
    }
  }

  loading.value = true
  try {
    const res = await listMaterial({ pid: String(pid), page: 1, size: 500, sort: ['sort,asc'] } as any)
    allMaterials.value = (res.data as any)?.list ?? res.data ?? []
  } catch {
    allMaterials.value = []
  } finally {
    loading.value = false
  }
}

const handleClear = () => {
  selectedId.value = null
  selectedName.value = null
  selectedType.value = null
}

const handleSave = async () => {
  if (selectedType.value !== 'LESSON') {
    Message.warning('请选择具体的课节')
    return
  }

  saving.value = true
  try {
    await setLessonMaterial(lessonId.value, selectedId.value, selectedName.value)
    Message.success('设置成功')
    visible.value = false
    emit('saveSuccess')
  } catch (e: any) {
    Message.error(`设置失败：${e?.message ?? e}`)
  } finally {
    saving.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}

const onOpen = async (id: string, name: string, cId: string, matId?: string | null, matName?: string | null) => {
  lessonId.value = id
  lessonName.value = name
  courseId.value = cId
  currentMaterialName.value = matName ?? null
  selectedId.value = matId ?? null
  selectedName.value = matName ?? null
  selectedType.value = null
  searchKeyword.value = ''
  breadcrumbs.value = []
  currentPid.value = null
  rootPid.value = null
  visible.value = true

  await loadMaterials(null)
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.current-material {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: var(--color-fill-2);
  border-radius: 6px;
  margin-bottom: 12px;

  .label {
    color: var(--color-text-2);
    font-size: 13px;
    white-space: nowrap;
    margin-right: 4px;
  }
}

.breadcrumb {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--color-fill-1);
  border-radius: 4px;
  font-size: 13px;
  overflow-x: auto;
  white-space: nowrap;
}

.material-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.material-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-2);
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-fill-2);
  }

  &.is-selected {
    background: var(--color-primary-light-1);
  }

  &.is-folder {
    font-weight: 500;
  }

  .item-content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .folder-icon,
  .file-icon {
    margin-right: 8px;
    flex-shrink: 0;
    font-size: 16px;
  }

  .folder-icon {
    color: rgb(var(--primary-6));
  }

  .file-icon {
    color: var(--color-text-3);
  }

  .material-name {
    font-size: 14px;
    color: var(--color-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: 8px;
  }

  .check-icon {
    color: rgb(var(--primary-6));
    font-size: 16px;
  }

  .arrow-icon {
    color: var(--color-text-3);
    font-size: 14px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
