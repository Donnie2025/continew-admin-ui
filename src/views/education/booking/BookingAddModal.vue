<template>
  <a-modal
    v-model:visible="visible"
    title="修改预约"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 600 ? 600 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <a-form :model="form" layout="vertical">
      <a-form-item label="教材">
        <a-select v-model="form.materialId" placeholder="请选择教材" allow-clear @change="onMaterialChange">
          <a-option v-for="m in materials" :key="m.id" :value="m.id">
            {{ m.name }}{{ m.level ? ' - ' + m.level : '' }}
          </a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="课节">
        <a-select v-model="form.lessonId" placeholder="请先选择教材" :disabled="!materialLessons.length" allow-clear>
          <a-option v-for="l in materialLessons" :key="l.id" :value="l.id">
            {{ l.name }}
          </a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="预约备注">
        <a-textarea v-model="form.remark" placeholder="请输入备注" :max-length="1024" show-word-limit />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getBooking, updateBooking } from '@/apis/education/booking'
import { listMaterial, listLessonsByMaterialId } from '@/apis/education/material'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)

const form = reactive({
  materialId: null as number | null,
  lessonId: null as number | null,
  remark: ''
})

const materials = ref<any[]>([])
const materialLessons = ref<any[]>([])

const loadMaterials = () => {
  listMaterial({ page: 1, size: 1000 } as any)
    .then(res => {
      const data = res?.data as any
      materials.value = Array.isArray(data) ? data : (data?.list || [])
    })
    .catch(() => { materials.value = [] })
}

const onMaterialChange = (id: any) => {
  form.lessonId = null
  materialLessons.value = []
  if (!id) return
  listLessonsByMaterialId(String(id))
    .then(res => {
      const data = res?.data as any
      materialLessons.value = Array.isArray(data) ? data : (data?.list || [])
    })
    .catch(() => { materialLessons.value = [] })
}

const reset = () => {
  form.materialId = null
  form.lessonId = null
  form.remark = ''
  materialLessons.value = []
}

const save = async () => {
  try {
    await updateBooking(form, dataId.value)
    Message.success('修改成功')
    emit('save-success')
    return true
  } catch {
    return false
  }
}

const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  loadMaterials()
  const { data } = await getBooking(id)
  form.materialId = (data as any).materialId ?? null
  form.lessonId = (data as any).lessonId ?? null
  form.remark = (data as any).remark ?? ''
  if (form.materialId) {
    onMaterialChange(form.materialId)
  }
  visible.value = true
}

defineExpose({ onUpdate })
</script>

<style scoped lang="scss"></style>
