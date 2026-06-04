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
      <template #mainTeacherId>
        <a-auto-complete
          v-model="teacherName"
          :data="teacherOptions"
          :loading="teacherLoading"
          :filter-option="false"
          placeholder="请输入教师姓名或手机号搜索"
          allow-clear
          @search="handleSearchTeacher"
          @select="handleSelectTeacher"
          @clear="handleClearTeacher"
        />
      </template>
    </GiForm>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { useWindowSize } from '@vueuse/core'
import { getCourse, addCourse, updateCourse } from '@/apis/education/course'
import { listActiveInstitutions, type InstitutionResp } from '@/apis/education/institution'
import { searchTeachers, getTeacher, type TeacherResp } from '@/apis/education/teacher'
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

// 教师搜索
const teacherOptions = ref<{ label: string; value: string; id: number | string }[]>([])
const teacherLoading = ref(false)
const teacherName = ref('')

const [form, resetForm] = useResetReactive({
  // todo 待补充
})

// 搜索教师
const handleSearchTeacher = async (keyword: string) => {
  if (!keyword || keyword.trim().length < 2) {
    teacherOptions.value = []
    return
  }
  
  teacherLoading.value = true
  try {
    const { data } = await searchTeachers(keyword.trim())
    teacherOptions.value = (data || []).map((item: TeacherResp) => ({
      label: `${item.name} (${item.phone})`,
      value: item.name, // 显示教师名字
      id: item.id // 存储教师ID
    }))
  } catch (error) {
    console.error('搜索教师失败', error)
    teacherOptions.value = []
  } finally {
    teacherLoading.value = false
  }
}

// 选择教师
const handleSelectTeacher = (value: string) => {
  const selectedTeacher = teacherOptions.value.find(item => item.value === value)
  if (selectedTeacher) {
    teacherName.value = selectedTeacher.value // 显示名字
    form.mainTeacherId = selectedTeacher.id // 表单存储ID
  }
}

// 清除教师
const handleClearTeacher = () => {
  teacherName.value = ''
  form.mainTeacherId = undefined
  teacherOptions.value = []
}

const columns: ColumnItem[] = reactive([
  {
    label: '教室名称',
    field: 'name',
    type: 'input',
    span: 24,
    required: true,
  },
  {
    label: '班主任',
    field: 'mainTeacherId',
    span: 24,
  },
  {
    label: '教室设置ID',
    field: 'courseSettingId',
    type: 'input',
    span: 24,
    props: {
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
  {
    label: '备注',
    field: 'remark',
    type: 'textarea',
    span: 24,
    props: {
      placeholder: '请输入备注信息',
      maxLength: 500,
      showWordLimit: true,
      autoSize: { minRows: 2, maxRows: 4 }
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
  teacherName.value = ''
  teacherOptions.value = []
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
  form.courseSettingId = ''
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
  
  // 如果有班主任ID，需要获取教师名字用于显示
  if (data.mainTeacherId) {
    try {
      const { data: teacher } = await getTeacher(data.mainTeacherId.toString())
      if (teacher) {
        teacherName.value = teacher.name
      }
    } catch (error) {
      console.error('获取教师信息失败', error)
    }
  }
  
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
