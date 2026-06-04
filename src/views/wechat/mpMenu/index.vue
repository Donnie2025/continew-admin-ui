<template>
  <div class="gi_table_page" style="padding: 20px;">
    <!-- 顶部操作栏 -->
    <a-card :bordered="false" style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 16px; font-weight: 600;">公众号菜单管理</span>
        <a-space>
          <a-button v-permission="['wechat:mp:menu:get']" @click="loadMenu">
            <template #icon><icon-refresh /></template>刷新
          </a-button>
          <a-button
            v-permission="['wechat:mp:menu:save']"
            :disabled="form.button.length >= 3"
            @click="onAdd"
          >
            <template #icon><icon-plus /></template>
            新增菜单<span v-if="form.button.length < 3">（还可添加 {{ 3 - form.button.length }} 个）</span>
          </a-button>
          <a-button v-permission="['wechat:mp:menu:save']" type="primary" :loading="loading" @click="onSave">
            <template #icon><icon-send /></template>保存并发布
          </a-button>
          <a-popconfirm
            v-permission="['wechat:mp:menu:delete']"
            content="确定要删除全部公众号菜单吗？删除后将立即对关注用户生效。"
            @ok="onDelete"
          >
            <a-button status="danger">
              <template #icon><icon-delete /></template>删除全部菜单
            </a-button>
          </a-popconfirm>
        </a-space>
      </div>
    </a-card>

    <a-row :gutter="16">
      <!-- 左侧：菜单列表 -->
      <a-col :xs="24" :sm="14">
        <a-card title="菜单列表" :bordered="false">
          <a-spin :loading="loading">
            <a-empty v-if="!form.button.length" description="暂无菜单，请点击「新增菜单」添加" />
            <div v-for="(btn, i) in form.button" :key="i" class="menu-group">
              <!-- 一级菜单头部 -->
              <div class="menu-header">
                <a-space>
                  <a-tag color="arcoblue">{{ i + 1 }}</a-tag>
                  <span class="menu-name">{{ btn.name || '（未命名）' }}</span>
                  <a-tag v-if="btn.type" size="small" color="green">{{ typeLabel(btn.type) }}</a-tag>
                  <a-tag v-if="btn.subButton?.length" size="small">{{ btn.subButton.length }} 个子菜单</a-tag>
                </a-space>
                <a-space>
                  <a-link @click="onUpdate(btn, i)"><icon-edit /> 编辑</a-link>
                  <a-popconfirm content="确定删除该菜单？" @ok="removeButton(i)">
                    <a-link status="danger"><icon-delete /> 删除</a-link>
                  </a-popconfirm>
                </a-space>
              </div>
              <!-- 子菜单列表 -->
              <div v-if="btn.subButton?.length" class="sub-list">
                <div v-for="(sub, j) in btn.subButton" :key="j" class="sub-item-row">
                  <span class="sub-prefix">└─</span>
                  <span class="sub-name">{{ sub.name || '（未命名）' }}</span>
                  <a-tag v-if="sub.type" size="small" color="green">{{ typeLabel(sub.type) }}</a-tag>
                  <span v-if="sub.key" class="sub-extra">KEY: {{ sub.key }}</span>
                  <span v-if="sub.url" class="sub-extra">URL: {{ sub.url }}</span>
                </div>
              </div>
            </div>
          </a-spin>
        </a-card>
      </a-col>

      <!-- 右侧：手机预览 -->
      <a-col :xs="24" :sm="10">
        <a-card title="预览" :bordered="false">
          <div class="phone-preview">
            <div class="phone-screen">
              <div class="preview-chat-area">
                <div class="preview-placeholder">公众号聊天区域</div>
              </div>
              <div class="preview-menu-bar">
                <div
                  v-for="(btn, i) in form.button"
                  :key="i"
                  class="preview-menu-item"
                  :class="{ active: activePreview === i }"
                  @click="activePreview = activePreview === i ? -1 : i"
                >
                  <span>{{ btn.name || '菜单' }}</span>
                </div>
              </div>
              <!-- 子菜单展开 -->
              <div v-if="activePreview >= 0 && form.button[activePreview]?.subButton?.length" class="preview-sub-menu">
                <div
                  v-for="(sub, j) in form.button[activePreview].subButton"
                  :key="j"
                  class="preview-sub-item"
                >{{ sub.name || '子菜单' }}</div>
              </div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <WechatMpMenuAddModal ref="addModalRef" @confirm="onModalConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { getMpMenu, saveMpMenu, deleteMpMenu, type MpMenuButton } from '@/apis/wechat/mpMenu'
import WechatMpMenuAddModal from './WechatMpMenuAddModal.vue'

defineOptions({ name: 'WechatMpMenu' })

const loading = ref(false)
const activePreview = ref(-1)
const addModalRef = ref<InstanceType<typeof WechatMpMenuAddModal>>()

const typeMap: Record<string, string> = {
  click: '点击事件',
  view: '跳转链接',
  miniprogram: '跳转小程序',
  scancode_push: '扫码',
  pic_sysphoto: '拍照发图',
  pic_photo_or_album: '相册选图',
  location_select: '发送位置',
  media_id: '发消息',
  article_id: '发图文',
}
const typeLabel = (type: string) => typeMap[type] || type

const form = reactive<{ button: MpMenuButton[] }>({ button: [] })

const loadMenu = async () => {
  loading.value = true
  try {
    const res = await getMpMenu()
    const buttons = res.data?.menu?.button || []
    form.button = buttons.map((b: any) => ({
      name: b.name,
      type: b.type,
      key: b.key,
      url: b.url,
      appid: b.appid,
      pagepath: b.pagepath,
      mediaId: b.media_id,
      subButton: (Array.isArray(b.sub_button) ? b.sub_button : []).map((s: any) => ({
        name: s.name,
        type: s.type,
        key: s.key,
        url: s.url,
        appid: s.appid,
        pagepath: s.pagepath,
        mediaId: s.media_id,
      })) || [],
    }))
  } catch (e) {
    form.button = []
  } finally {
    loading.value = false
  }
}

/** 打开新增弹窗 */
const onAdd = () => {
  addModalRef.value?.onAdd()
}

/** 打开编辑弹窗 */
const onUpdate = (btn: MpMenuButton, index: number) => {
  addModalRef.value?.onUpdate(btn, index)
}

/** Modal 确认回调 */
const onModalConfirm = (button: MpMenuButton, index: number) => {
  if (index < 0) {
    // 新增
    form.button.push(button)
  } else {
    // 更新
    form.button.splice(index, 1, button)
  }
}

const removeButton = (i: number) => {
  form.button.splice(i, 1)
  if (activePreview.value === i) activePreview.value = -1
}

const onSave = async () => {
  if (!form.button.length) {
    Message.warning('请至少添加一个菜单')
    return
  }
  loading.value = true
  try {
    await saveMpMenu({ button: form.button })
    Message.success('菜单保存并发布成功')
  } finally {
    loading.value = false
  }
}

const onDelete = async () => {
  loading.value = true
  try {
    await deleteMpMenu()
    form.button = []
    Message.success('菜单已删除')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMenu()
})
</script>

<style scoped lang="scss">
.menu-group {
  margin-bottom: 12px;
  background: var(--color-fill-2);
  border-radius: 6px;
  padding: 12px;
}

.menu-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.menu-name {
  font-weight: 600;
  font-size: 14px;
}

.sub-list {
  margin-top: 8px;
  padding-left: 16px;
}

.sub-item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  flex-wrap: wrap;
}

.sub-prefix {
  color: var(--color-text-3);
}

.sub-name {
  font-weight: 500;
}

.sub-extra {
  color: var(--color-text-3);
  font-size: 12px;
}

/* 手机预览 */
.phone-preview {
  display: flex;
  justify-content: center;
}

.phone-screen {
  width: 300px;
  height: 480px;
  border: 2px solid #ddd;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  position: relative;
}

.preview-chat-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  color: #bbb;
  font-size: 13px;
}

.preview-menu-bar {
  display: flex;
  border-top: 1px solid #e0e0e0;
  background: #fff;
}

.preview-menu-item {
  flex: 1;
  text-align: center;
  padding: 10px 4px;
  font-size: 12px;
  cursor: pointer;
  border-right: 1px solid #e0e0e0;
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:last-child { border-right: none; }
  &.active { background: #f0f0f0; color: #1677ff; }
}

.preview-sub-menu {
  position: absolute;
  bottom: 41px;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e0e0e0;
}

.preview-sub-item {
  padding: 10px 16px;
  font-size: 12px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;

  &:last-child { border-bottom: none; }
}
</style>
