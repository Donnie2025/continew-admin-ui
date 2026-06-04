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
          :class="{ 'is-selected': selectedId === item.id }"
          @click="handleSelect(item)"
        >
          <icon-check v-if="selectedId === item.id" class="check-icon" />
          <span class="material-name">{{ item.name }}</span>
        </div>
      </div>
    </a-spin>

    <!-- 底部按钮 -->
    <div class="modal-footer">
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" :loading="saving" @click="handleSave">确定</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { IconCheck } from '@arco-design/web-vue/es/icon'
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
const searchKeyword = ref('')
const allMaterials = ref<MaterialResp[]>([])

const filteredMaterials = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  return allMaterials.value.filter(m => !kw || m.name.toLowerCase().includes(kw))
})

const handleSelect = (item: MaterialResp) => {
  selectedId.value = item.id
  selectedName.value = item.name
}

const handleClear = () => {
  selectedId.value = null
  selectedName.value = null
}

const handleSave = async () => {
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
  searchKeyword.value = ''
  visible.value = true
  loading.value = true
  try {
    const pidRes = await getCourseMaterialId(cId)
    const pid = (pidRes.data as any) ?? null
    if (!pid) {
      allMaterials.value = []
      return
    }
    const res = await listMaterial({ pid: String(pid), page: 1, size: 500, sort: ['sort,asc'] } as any)
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

.material-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.material-item {
  display: flex;
  align-items: center;
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

  .check-icon {
    color: rgb(var(--primary-6));
    margin-right: 8px;
    flex-shrink: 0;
  }

  .material-name {
    font-size: 14px;
    color: var(--color-text-1);
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
