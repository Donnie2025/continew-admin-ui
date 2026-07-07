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
      <template #avatar="{ model }">
        <div class="upload-wrapper">
          <a-upload
            :auto-upload="false"
            :show-file-list="false"
            :accept="acceptTypes"
            :before-upload="beforeAvatarUpload"
            @change="handleChange"
            list-type="picture-card"
          >
            <template #upload-button>
              <div class="image-wrapper">
                <img :src="uploadFile?.url || defaultAvatar" />
                <div class="image-mask">
                  <IconEdit />
                </div>
                <a-progress
                  v-if="uploadFile?.status === 'uploading'"
                  :percent="uploadFile?.percent"
                  type="circle"
                  size="mini"
                  :style="{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translateX(-50%) translateY(-50%)',
                  }"
                />
              </div>
            </template>
          </a-upload>
          <div class="upload-tip">支持 jpg、png、gif、webp、bmp 格式，大小不超过 5MB</div>
        </div>
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getStudent, addStudent, updateStudent } from '@/apis/education/student'
import { type AgentOption, listAgentOptions } from '@/apis/education/agent'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'
import { IconEdit, IconPlus } from '@arco-design/web-vue/es/icon'
import { uploadFile as uploadFileApi } from '@/apis/common/common'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改学生' : '新增学生'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { sex_type } = useDict('sex_type')
const uploadFile = ref()
const agentOptions = ref<AgentOption[]>([])
listAgentOptions().then(res => { agentOptions.value = res.data })

const [form, resetForm] = useResetReactive({
  name: undefined,
  agentCode: undefined,
  gender: undefined,
  phone: undefined,
  email: undefined,
  avatar: undefined,
  password: undefined,
  remark: undefined,
  enableRecording: 0,
  institutionId: undefined
})

const acceptTypes = 'image/jpeg,image/png,image/jpg,image/gif,image/webp,image/bmp'

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const beforeAvatarUpload = (file: File) => {
  const isValidType = acceptTypes.split(',').includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isValidType) {
    Message.error('上传头像只能是 JPG/PNG/GIF/WebP/BMP 格式!')
    return false
  }
  if (!isLt5M) {
    Message.error('上传头像大小不能超过 5MB!')
    return false
  }
  return true
}

const handleChange = async (_: any, currentFile: any) => {
  if (!currentFile || !currentFile.file) return

  // 先设置上传状态
  uploadFile.value = {
    file: currentFile.file,
    status: 'uploading',
    percent: 0,
    url: defaultAvatar
  }

  try {
    // 读取文件预览
    const previewUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event: ProgressEvent<FileReader>) => {
        resolve(event.target?.result as string)
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(currentFile.file)
    })

    // 更新预览图
    uploadFile.value = {
      ...uploadFile.value,
      url: previewUrl
    }

    // 开始上传文件
    const formData = new FormData()
    formData.append('file', currentFile.file)
    const { data } = await uploadFileApi(formData)
    
    // 更新表单和预览状态，只使用返回的 url 字段
    form.avatar = data.url
    uploadFile.value = {
      file: currentFile.file,
      url: previewUrl, // 继续使用本地预览图以获得更好的显示效果
      status: 'done',
      percent: 100
    }
    Message.success('头像上传成功')
  } catch (error) {
    console.error('头像上传失败:', error)
    uploadFile.value = {
      file: currentFile.file,
      url: defaultAvatar,
      status: 'error',
      percent: 0
    }
    Message.error('头像上传失败')
  }
}

const handleProgress = (currentFile: any) => {
  uploadFile.value = currentFile
}

// 修改时设置头像
watch(() => form.avatar, (newValue) => {
  if (newValue) {
    uploadFile.value = {
      status: 'done',
      url: newValue // 直接使用 URL
    }
  } else {
    uploadFile.value = {
      status: 'done',
      url: defaultAvatar
    }
  }
}, { immediate: true })

const columns: ColumnItem[] = reactive([
  {
    label: '学生姓名',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '代理商',
    field: 'agentCode',
    type: 'select',
    span: 24,
    props: {
      options: agentOptions,
      fieldNames: { value: 'code', label: 'name' },
      allowClear: true,
      allowSearch: true,
    },
  },
  {
    label: '手机号码',
    field: 'phone',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '性别',
    field: 'gender',
    type: 'select',
    span: 24,
    props: {
      options: sex_type,
    },
  },
  {
    label: '邮箱',
    field: 'email',
    type: 'input',
    span: 24,
  },
  {
    label: '头像',
    field: 'avatar',
    type: 'custom',
    span: 24,
  },
  {
    label: '密码',
    field: 'password',
    type: 'input',
    props: {
      type: 'password',
      showPassword: true,
    },
    span: 24,
  },
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
  },
  {
    label: '是否允许录课',
    field: 'enableRecording',
    type: 'radio',
    span: 24,
    props: {
      options: [
        { label: '不允许', value: 0 },
        { label: '允许', value: 1 }
      ]
    }
  },
  {
    label: '所属机构ID',
    field: 'institutionId',
    type: 'input',
    span: 24,
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
  uploadFile.value = undefined
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false

    // 确保头像字段被正确设置
    if (uploadFile.value?.status === 'error') {
      Message.error('头像上传失败，请重新上传')
      return false
    }

    if (isUpdate.value) {
      await updateStudent(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addStudent(form)
      Message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增
const onAdd = async () => {
  reset()
  dataId.value = ''
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  try {
    const { data } = await getStudent(id)
    Object.assign(form, data)
    visible.value = true
  } catch (error) {
    console.error('获取学生信息失败', error)
    Message.error('获取学生信息失败，请稍后重试')
  }
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="less">
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
  border-radius: 2px;
  overflow: hidden;
  background: var(--color-fill-2);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover .image-mask {
    opacity: 1;
  }
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  color: #fff;
  cursor: pointer;
}

.upload-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-text-2);

  .arco-icon {
    font-size: 24px;
    margin-bottom: 8px;
  }
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
}

.upload-tip {
  color: var(--color-text-3);
  font-size: 12px;
}
</style>

