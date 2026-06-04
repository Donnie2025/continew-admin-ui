<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 600 ? 600 : '100%'"
    draggable
    @before-ok="save"
    @close="reset"
  >
    <GiForm ref="formRef" v-model="form" :columns="columns">
      <template #coverImg>
        <div class="upload-wrapper">
          <a-upload
            :auto-upload="false"
            :show-file-list="false"
            accept="image/jpeg,image/png,image/webp,image/gif"
            list-type="picture-card"
            :before-upload="beforeCoverUpload"
            @change="handleCoverChange"
          >
            <template #upload-button>
              <div class="image-wrapper">
                <img v-if="coverFile?.url" :src="coverFile.url" style="width:100%;height:100%;object-fit:cover;border-radius:4px" />
                <icon-plus v-else style="font-size:24px;color:var(--color-text-3)" />
                <div v-if="coverFile?.url" class="image-mask"><IconEdit /></div>
                <a-progress
                  v-if="coverFile?.status === 'uploading'"
                  :percent="coverFile?.percent"
                  type="circle"
                  size="mini"
                  :style="{ position: 'absolute', left: '50%', top: '50%', transform: 'translateX(-50%) translateY(-50%)' }"
                />
              </div>
            </template>
          </a-upload>
          <div class="upload-tip">支持 jpg、png、webp、gif，不超过 5MB（可选）</div>
        </div>
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { IconEdit, IconPlus } from '@arco-design/web-vue/es/icon'
import { useWindowSize } from '@vueuse/core'
import { getMaterial, addMaterial, updateMaterial } from '@/apis/education/material'
import { createCloudFolder } from '@/apis/education/classinCloud'
import { createFeishuFolder } from '@/apis/education/feishu'
import { uploadFile as uploadFileApi } from '@/apis/common/common'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改教材' : '新增教材'))
const formRef = ref<InstanceType<typeof GiForm>>()

const typeOptions = ref<Array<{ label: string; value: string }>>([])

const ALL_TYPE_OPTIONS = [
  { label: '分类', value: 'CATEGORY' },
  { label: '课本', value: 'BOOK' },
  { label: '级别', value: 'LEVEL' },
  { label: '单元', value: 'UNIT' },
  { label: '课节', value: 'LESSON' },
]

const parentCloudId = ref<string | null>(null)
const parentFeishuFolderToken = ref<string | null>(null)
const originalCloudId = ref<string | null>(null)
const originalCloudName = ref<string | null>(null)
const originalName = ref<string>('')
const originalType = ref<string>('')

const [form, resetForm] = useResetReactive({
  pid: 0 as number,
  type: '',
  code: '',
  name: '',
  coverImg: '',
  description: '',
  isShow: true,
  sort: 1
})

const isBook = computed(() => form.type === 'BOOK')

const columns: ColumnItem[] = reactive([
  {
    label: '名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '类型',
    field: 'type',
    type: 'select',
    span: 24,
    required: true,
    get props() {
      return { options: typeOptions.value, allowClear: false }
    }
  },
  {
    label: '编码',
    field: 'code',
    type: 'input',
    span: 24,
    get required() { return isBook.value },
    get hide() { return !isBook.value }
  },
  {
    label: '封面图片',
    field: 'coverImg',
    type: 'input',
    span: 24,
    required: false,
    get hide() { return !isBook.value }
  },
  {
    label: '教材描述',
    field: 'description',
    type: 'textarea',
    span: 24,
    required: false,
    get hide() { return !isBook.value }
  },
  {
    label: '是否展示',
    field: 'isShow',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: [
        { label: '展示', value: true },
        { label: '不展示', value: false }
      ]
    }
  },
  {
    label: '排序',
    field: 'sort',
    type: 'input-number',
    span: 24,
    required: true,
    props: {
      min: 0,
      max: 9999,
      placeholder: '请输入排序值，数字越小越靠前'
    }
  }
])

// 封面图片上传
const coverFile = ref<any>(null)

const beforeCoverUpload = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    Message.error('只支持 jpg、png、webp、gif 格式')
    return false
  }
  if (file.size / 1024 / 1024 > 5) {
    Message.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const handleCoverChange = async (_fileList: any[], currentFile: any) => {
  if (!currentFile?.file) return
  const previewUrl = URL.createObjectURL(currentFile.file)
  coverFile.value = { status: 'uploading', percent: 0, url: previewUrl }
  try {
    const formData = new FormData()
    formData.append('file', currentFile.file)
    const { data } = await uploadFileApi(formData)
    form.coverImg = data.url
    coverFile.value = { status: 'done', url: previewUrl }
    Message.success('封面上传成功')
  } catch {
    coverFile.value = { status: 'error', url: '' }
    Message.error('封面上传失败')
  }
}

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  coverFile.value = null
  parentCloudId.value = null
  parentFeishuFolderToken.value = null
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (coverFile.value?.status === 'error') {
      Message.error('封面上传失败，请重新上传')
      return false
    }
    if (isUpdate.value) {
      try {
        await updateMaterial({ ...form, cloudName: form.name }, dataId.value)
        Message.success('修改成功')
      } catch (error: any) {
        // 如果是同步失败的提示，显示警告而不是错误
        const errorMsg = error?.response?.data?.msg || error?.message || '修改失败'
        if (errorMsg.includes('重命名失败') || errorMsg.includes('同步失败')) {
          Message.warning(errorMsg)
          // 虽然同步失败，但数据库已更新，仍然刷新列表
          emit('save-success')
          return true
        } else {
          Message.error(errorMsg)
          return false
        }
      }
    } else {
      const { data: newIdResp } = await addMaterial(form)
      const newId = newIdResp?.id
      Message.success('新增成功')
      if (form.type !== 'LESSON' && parentCloudId.value && newId) {
        try {
          // 在 ClassIn 创建文件夹
          const { data: folderId } = await createCloudFolder(parentCloudId.value, form.name)

          // 同时在飞书创建文件夹
          let feishuFolderToken = null
          try {
            const { data: feishuToken } = await createFeishuFolder(parentFeishuFolderToken.value, form.name)
            feishuFolderToken = feishuToken
          } catch (feishuErr) {
            console.warn('飞书文件夹创建失败:', feishuErr)
          }

          if (folderId) {
            await updateMaterial({
              ...form,
              cloudId: folderId,
              cloudName: form.name,
              feishuFolderToken
            }, String(newId))
          }
        } catch {
          Message.warning('教材已创建，ClassIn文件夹创建失败，请稍后在云盘同步')
        }
      }
    }
    emit('save-success')
    return true
  } catch {
    return false
  }
}

// 新增
const onAdd = (opts: Array<{ label: string; value: string }>, maxSort: number, pid: any, cloudId?: string | null, feishuFolderToken?: string | null) => {
  reset()
  dataId.value = ''
  typeOptions.value = opts.length === 1 ? opts : ALL_TYPE_OPTIONS
  form.sort = maxSort + 1
  form.pid = pid ? Number(pid) : 0
  parentCloudId.value = cloudId ?? null
  parentFeishuFolderToken.value = feishuFolderToken ?? null
  if (opts.length === 1) form.type = opts[0].value
  visible.value = true
}

// 修改
const onUpdate = async (id: string, opts: Array<{ label: string; value: string }>) => {
  reset()
  dataId.value = id
  typeOptions.value = opts
  const { data } = await getMaterial(id)
  Object.assign(form, data)
  originalCloudId.value = (data as any).cloudId ?? null
  originalCloudName.value = (data as any).cloudName ?? null
  originalName.value = data.name ?? ''
  originalType.value = data.type ?? ''
  if (data.coverImg) {
    coverFile.value = { status: 'done', url: data.coverImg }
  }
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss">
.upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.arco-upload) {
  display: block;
  width: 100px;
}

:deep(.arco-upload-picture-card) {
  width: 100px;
  height: 100px;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  opacity: 0;
  transition: opacity 0.2s;
  border-radius: 4px;
}

.image-wrapper:hover .image-mask {
  opacity: 1;
}

.upload-tip {
  color: var(--color-text-3);
  font-size: 12px;
}
</style>
