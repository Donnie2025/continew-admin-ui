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
    <GiForm ref="formRef" v-model="form" :columns="columns" />
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getTeacher, addTeacher, updateTeacher } from '@/apis/education/teacher'
import { type ColumnItem, GiForm } from '@/components/GiForm'
import { useResetReactive } from '@/hooks'
import { useDict } from '@/hooks/app'

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改教师' : '新增教师'))
const formRef = ref<InstanceType<typeof GiForm>>()
const { sex_type,is_show,is_fix,status } = useDict('sex_type','is_show','is_fix','status')

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
  {
    label: '教师姓名',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '教师工号',
    field: 'teacherNo',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '评分',
    field: 'score',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '性别（0-未知 1-男 2-女）',
    field: 'gender',
    type: 'radio-group',
    span: 24,
    props: {
      options: sex_type,
    },
  },
  {
    label: '是否展示',
    field: 'isShow',
    type: 'switch',
    span: 24,
    required: true,
    props: {
      options: is_show,
    },
  },
  {
    label: '是否固定',
    field: 'isFixed',
    type: 'radio-group',
    span: 24,
    required: true,
    props: {
      options: is_fix,
    },
  },
  {
    label: '手机号码',
    field: 'phone',
    type: 'input',
    span: 24,
  },
  {
    label: '邮箱',
    field: 'email',
    type: 'input',
    span: 24,
  },
  {
    label: '头像地址',
    field: 'headImg',
    type: 'input',
    span: 24,
  },
  {
    label: '音频地址',
    field: 'audioUrl',
    type: 'input',
    span: 24,
  },
  {
    label: '视频地址',
    field: 'videoUrl',
    type: 'input',
    span: 24,
  },
  {
    label: '简介',
    field: 'briefIntro',
    type: 'input',
    span: 24,
  },
  {
    label: '描述',
    field: 'description',
    type: 'textarea',
    props: {
      autoSize: true
    },
    span: 24,
  },
  {
    label: '排序',
    field: 'sort',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '状态',
    field: 'status',
    type: 'switch',
    span: 24,
    props: {
      options: status,
    },
  },
])

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    if (isInvalid) return false
    if (isUpdate.value) {
      await updateTeacher(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addTeacher(form)
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
  const { data } = await getTeacher(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
