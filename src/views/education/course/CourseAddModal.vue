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
import { getCourse, addCourse, updateCourse } from '@/apis/education/course'
import { listActiveInstitutions, type InstitutionResp } from '@/apis/education/institution'
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
const title = computed(() => (isUpdate.value ? '修改班级' : '新增班级'))
const formRef = ref<InstanceType<typeof GiForm>>()

// 机构列表
const institutionOptions = ref<{ label: string; value: string | number }[]>([])
const institutionLoading = ref(false)

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

const columns: ColumnItem[] = reactive([
  {
    label: '教室名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '班主任手机号',
    field: 'mainTeacherPhone',
    type: 'input',
    span: 24,
    componentProps: {
      placeholder: '请输入班主任手机号',
      allowClear: true,
    },
  },
  {
    label: '教室设置ID',
    field: 'courseSettingId',
    type: 'input',
    span: 24,
    componentProps: {
      placeholder: '请输入教室设置ID',
    },
  },
  {
    label: '所属机构',
    field: 'institutionId',
    type: 'select',
    span: 24,
    props: {
      allowClear: true,
      loading: institutionLoading,
      options: institutionOptions,
      placeholder: '请选择所属机构'
    }
  },
])

// 加载机构列表
const fetchInstitutionOptions = async (setDefault = false) => {
  institutionLoading.value = true
  try {
    const { data } = await listActiveInstitutions()
    institutionOptions.value = (data || []).map((item: InstitutionResp) => ({
      label: item.name,
      value: item.id
    }))
    
    // 如果是新增，设置默认值为"元气森林"
    if (setDefault && data && data.length > 0) {
      const yuanqisenlin = data.find((item: InstitutionResp) => item.name === '元气森林')
      if (yuanqisenlin) {
        form.institutionId = yuanqisenlin.id
      }
    }
  } catch (error) {
    console.error('获取机构列表失败', error)
  } finally {
    institutionLoading.value = false
  }
}

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
      await updateCourse(form, dataId.value)
      Message.success('修改成功')
    } else {
      await addCourse(form)
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
  // 设置默认值
  form.courseSettingId = '1'
  await fetchInstitutionOptions(true) // 传递true表示设置默认值
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  await fetchInstitutionOptions(false) // 编辑时不设置默认值
  const { data } = await getCourse(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
