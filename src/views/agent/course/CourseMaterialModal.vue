<template>
  <a-modal
    v-model:visible="visible"
    :title="`设置教材 - ${courseName}`"
    width="680px"
    :mask-closable="false"
    :esc-to-close="false"
    unmount-on-close
    @before-ok="handleSave"
    @cancel="handleCancel"
  >
    <div class="material-modal-container">
      <!-- 当前已关联教材 -->
      <div v-if="currentMaterialName" class="current-material">
        <span class="label">当前教材：</span>
        <a-tag color="arcoblue">{{ currentMaterialName }}</a-tag>
        <a-link status="danger" style="margin-left: 8px;" @click="handleClear">清除</a-link>
      </div>
      <div v-else class="current-material empty">
        <span class="label">当前教材：</span>
        <span style="color: #999;">未设置</span>
      </div>

      <!-- 搜索框 -->
      <a-input-search
        v-model="searchKeyword"
        placeholder="搜索教材名称"
        allow-clear
        style="margin: 12px 0 8px;"
      />

      <!-- 教材列表 -->
      <a-spin :loading="loading" style="width: 100%">
        <div class="material-list">
          <div
            v-for="item in filteredMaterials"
            :key="item.id"
            class="material-item"
            :class="{ selected: selectedId === item.id }"
            @click="handleSelect(item)"
          >
            <div class="item-left">
              <a-tag :color="typeColorMap[item.type] || 'gray'" size="small" style="margin-right: 8px; flex-shrink: 0;">
                {{ typeLabelMap[item.type] || item.type }}
              </a-tag>
              <span class="item-name" :title="item.name">{{ item.name }}</span>
            </div>
            <icon-check v-if="selectedId === item.id" class="check-icon" />
          </div>
          <a-empty v-if="filteredMaterials.length === 0" style="margin-top: 40px">
            <template #description>
              <span v-if="searchKeyword">未找到"{{ searchKeyword }}"相关教材</span>
              <span v-else>暂无教材数据</span>
            </template>
          </a-empty>
        </div>
      </a-spin>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { IconCheck } from '@arco-design/web-vue/es/icon'
import { listAllMaterialsForTree, type MaterialResp } from '@/apis/education/material'
import { setCourseMaterial } from '@/apis/agent/course'

const emit = defineEmits<{ saveSuccess: [] }>()

const visible = ref(false)
const loading = ref(false)
const courseId = ref('')
const courseName = ref('')
const agentCode = ref('')
const currentMaterialId = ref<string | null>(null)
const currentMaterialName = ref<string | null>(null)
const selectedId = ref<string | null>(null)
const selectedName = ref<string | null>(null)
const searchKeyword = ref('')
const allMaterials = ref<MaterialResp[]>([])

const typeLabelMap: Record<string, string> = {
  CATEGORY: '分类',
  BOOK: '课本',
  LEVEL: '级别',
  UNIT: '单元',
  LESSON: '课节',
}

const typeColorMap: Record<string, string> = {
  CATEGORY: 'purple',
  BOOK: 'arcoblue',
  LEVEL: 'green',
  UNIT: 'orange',
  LESSON: 'gray',
}

const filteredMaterials = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  return allMaterials.value.filter(m => {
    if (m.type !== 'BOOK') return false
    if (agentCode.value === 'youyan' && !m.name.startsWith('【H') && !m.name.startsWith('【C')) return false
    return !kw || m.name.toLowerCase().includes(kw)
  })
})

const handleSelect = (item: MaterialResp) => {
  selectedId.value = item.id
  selectedName.value = item.name
}

const handleClear = () => {
  selectedId.value = null
  selectedName.value = null
  currentMaterialId.value = null
  currentMaterialName.value = null
}

const handleSave = async () => {
  try {
    await setCourseMaterial(
      courseId.value,
      selectedId.value,
      selectedName.value
    )
    Message.success('教材设置成功')
    emit('saveSuccess')
    return true
  } catch (e: any) {
    Message.error(`设置失败：${e?.message ?? e}`)
    return false
  }
}

const handleCancel = () => {
  visible.value = false
  agentCode.value = ''
}

const onOpen = async (id: string, name: string, matId?: string | null, matName?: string | null, code?: string | null) => {
  courseId.value = id
  courseName.value = name
  agentCode.value = code ?? ''
  currentMaterialId.value = matId ?? null
  currentMaterialName.value = matName ?? null
  selectedId.value = matId ?? null
  selectedName.value = matName ?? null
  searchKeyword.value = ''
  visible.value = true
  loading.value = true
  try {
    const res = await listAllMaterialsForTree()
    allMaterials.value = (res.data as any)?.list ?? res.data ?? []
  } catch {
    allMaterials.value = []
  } finally {
    loading.value = false
  }
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.material-modal-container {
  display: flex;
  flex-direction: column;
  height: 460px;
}

.current-material {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-fill-2);
  border-radius: 4px;

  .label {
    font-size: 13px;
    color: var(--color-text-2);
    margin-right: 4px;
  }

  &.empty .label {
    color: var(--color-text-3);
  }
}

.material-list {
  flex: 1;
  overflow-y: auto;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  max-height: 340px;
}

.material-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border-1);
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--color-fill-2);
  }

  &.selected {
    background: var(--color-primary-light-1);
  }

  .item-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
  }

  .item-name {
    font-size: 13px;
    color: var(--color-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .check-icon {
    color: rgb(var(--primary-6));
    font-size: 16px;
    flex-shrink: 0;
    margin-left: 8px;
  }
}
</style>
