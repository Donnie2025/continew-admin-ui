<template>
  <a-modal
    v-model:visible="visible"
    :title="isUpdate ? '编辑菜单' : '新增菜单'"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 700 ? 680 : '100%'"
    draggable
    @before-ok="onConfirm"
    @close="reset"
  >
    <a-form :model="form" layout="vertical">
      <!-- 菜单名称 -->
      <a-form-item label="菜单名称" field="name" required>
        <a-input v-model="form.name" placeholder="一级菜单≤4个中文，子菜单≤8个中文" :max-length="16" allow-clear />
      </a-form-item>

      <!-- 类型（有子菜单时禁用） -->
      <a-form-item label="按钮类型" field="type">
        <a-select
          v-model="form.type"
          placeholder="有子菜单时不需要选择类型"
          allow-clear
          :disabled="form.subButton.length > 0"
        >
          <a-option v-for="t in buttonTypes" :key="t.value" :value="t.value">{{ t.label }}</a-option>
        </a-select>
        <template #extra>
          <span v-if="form.subButton.length > 0" style="color: #86909c;">已有子菜单，无需设置按钮类型</span>
        </template>
      </a-form-item>

      <!-- 动态字段 -->
      <template v-if="!form.subButton.length">
        <a-form-item v-if="needKey(form.type)" label="事件 KEY" field="key">
          <a-input v-model="form.key" placeholder="请输入 KEY（如：MENU_HOME）" allow-clear />
        </a-form-item>
        <a-form-item v-if="needUrl(form.type)" label="跳转 URL" field="url">
          <a-input v-model="form.url" placeholder="请输入完整 URL（https://...）" allow-clear />
        </a-form-item>
        <template v-if="form.type === 'miniprogram'">
          <a-form-item label="小程序 AppId" field="appid">
            <a-input v-model="form.appid" placeholder="请输入小程序 AppId" allow-clear />
          </a-form-item>
          <a-form-item label="小程序页面路径" field="pagepath">
            <a-input v-model="form.pagepath" placeholder="如：pages/index/index" allow-clear />
          </a-form-item>
        </template>
      </template>

      <!-- 子菜单 -->
      <a-form-item label="子菜单">
        <div v-for="(sub, j) in form.subButton" :key="j" class="sub-item">
          <a-space wrap>
            <a-input v-model="sub.name" placeholder="子菜单名称" style="width: 140px;" :max-length="24" />
            <a-select v-model="sub.type" placeholder="类型" style="width: 120px;">
              <a-option v-for="t in buttonTypes" :key="t.value" :value="t.value">{{ t.label }}</a-option>
            </a-select>
            <a-input v-if="needKey(sub.type)" v-model="sub.key" placeholder="KEY" style="width: 120px;" />
            <a-input v-if="needUrl(sub.type)" v-model="sub.url" placeholder="URL" style="width: 200px;" />
            <a-input v-if="sub.type === 'miniprogram'" v-model="sub.appid" placeholder="AppId" style="width: 120px;" />
            <a-input v-if="sub.type === 'miniprogram'" v-model="sub.pagepath" placeholder="页面路径" style="width: 160px;" />
            <a-button size="mini" status="danger" @click="removeSubButton(j)">
              <icon-minus />
            </a-button>
          </a-space>
        </div>
        <a-button
          v-if="form.subButton.length < 5"
          type="dashed"
          size="small"
          style="margin-top: 8px;"
          @click="addSubButton"
        >
          <template #icon><icon-plus /></template>
          添加子菜单（还可添加 {{ 5 - form.subButton.length }} 个）
        </a-button>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import type { MpMenuButton } from '@/apis/wechat/mpMenu'

const emit = defineEmits<{
  (e: 'confirm', button: MpMenuButton, index: number): void
}>()

const { width } = useWindowSize()
const visible = ref(false)
const editIndex = ref(-1)
const isUpdate = computed(() => editIndex.value >= 0)

const buttonTypes = [
  { value: 'click', label: '点击事件' },
  { value: 'view', label: '跳转链接' },
  { value: 'miniprogram', label: '跳转小程序' },
  { value: 'scancode_push', label: '扫码' },
  { value: 'pic_sysphoto', label: '拍照发图' },
  { value: 'pic_photo_or_album', label: '相册选图' },
  { value: 'location_select', label: '发送位置' },
  { value: 'media_id', label: '发消息' },
  { value: 'article_id', label: '发图文' },
]

const needKey = (type?: string) =>
  ['click', 'scancode_push', 'pic_sysphoto', 'pic_photo_or_album', 'location_select', 'media_id', 'article_id'].includes(type || '')
const needUrl = (type?: string) => ['view', 'miniprogram'].includes(type || '')

const defaultForm = (): MpMenuButton & { subButton: MpMenuButton[] } => ({
  name: '',
  type: 'click',
  key: '',
  url: '',
  appid: '',
  pagepath: '',
  subButton: [],
})

const form = reactive(defaultForm())

const reset = () => {
  Object.assign(form, defaultForm())
  form.subButton = []
}

const addSubButton = () => {
  form.subButton.push({ name: '', type: 'click', key: '' })
  // 有子菜单时清空 type
  form.type = undefined
}

const removeSubButton = (j: number) => {
  form.subButton.splice(j, 1)
  if (form.subButton.length === 0) {
    form.type = 'click'
  }
}

const onConfirm = async () => {
  if (!form.name?.trim()) {
    Message.warning('菜单名称不能为空')
    return false
  }
  emit('confirm', { ...form }, editIndex.value)
  return true
}

/** 新增模式 */
const onAdd = () => {
  reset()
  editIndex.value = -1
  visible.value = true
}

/** 编辑模式 */
const onUpdate = (btn: MpMenuButton, index: number) => {
  reset()
  editIndex.value = index
  Object.assign(form, {
    name: btn.name,
    type: btn.type,
    key: btn.key,
    url: btn.url,
    appid: btn.appid,
    pagepath: btn.pagepath,
    subButton: (btn.subButton || []).map(s => ({ ...s })),
  })
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss">
.sub-item {
  padding: 8px;
  background: var(--color-fill-2);
  border-radius: 6px;
  margin-bottom: 8px;
}
</style>
