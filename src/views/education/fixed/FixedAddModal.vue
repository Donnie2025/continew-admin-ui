<template>
  <a-drawer
    v-model:visible="visible"
    :title="title"
    width="565px"
    :footer="true"
    unmount-on-close
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
      <a-form-item label="教师" field="teacherId" required v-if="!props.teacherId">
        <a-select
          v-model="form.teacherId"
          placeholder="请选择教师"
          allow-search
          :loading="teacherLoading"
          @search="searchTeachers"
        >
          <a-option v-for="teacher in teacherList" :key="teacher.id" :value="teacher.id">
            {{ teacher.name }}
          </a-option>
        </a-select>
      </a-form-item>
      
      <a-form-item label="星期" field="weekDays" required>
        <a-checkbox-group v-model="form.weekDays" direction="horizontal">
          <a-checkbox :value="1">周一</a-checkbox>
          <a-checkbox :value="2">周二</a-checkbox>
          <a-checkbox :value="3">周三</a-checkbox>
          <a-checkbox :value="4">周四</a-checkbox>
          <a-checkbox :value="5">周五</a-checkbox>
          <a-checkbox :value="6">周六</a-checkbox>
          <a-checkbox :value="7">周日</a-checkbox>
        </a-checkbox-group>
      </a-form-item>
      
      <a-form-item field="startTimes" required>
        <template #label>
          <span></span>
        </template>
        
        <div class="time-sections-wrapper">
          <!-- 上午时间 -->
          <div class="time-section">
            <div class="section-header">
              <span class="section-title">上午时间</span>
              <a-checkbox v-model="morningAllSelected" @change="toggleMorningAll">全选</a-checkbox>
            </div>
            <a-checkbox-group v-model="form.startTimes" class="time-checkbox-group">
              <a-checkbox v-for="time in morningTimes" :key="time" :value="time" class="time-checkbox">
                {{ time }}
              </a-checkbox>
            </a-checkbox-group>
          </div>

          <!-- 下午时间 -->
          <div class="time-section">
            <div class="section-header">
              <span class="section-title">下午时间</span>
              <a-checkbox v-model="afternoonAllSelected" @change="toggleAfternoonAll">全选</a-checkbox>
            </div>
            <a-checkbox-group v-model="form.startTimes" class="time-checkbox-group">
              <a-checkbox v-for="time in afternoonTimes" :key="time" :value="time" class="time-checkbox">
                {{ time }}
              </a-checkbox>
            </a-checkbox-group>
          </div>

          <!-- 晚上时间 -->
          <div class="time-section">
            <div class="section-header">
              <span class="section-title">晚上时间</span>
              <a-checkbox v-model="eveningAllSelected" @change="toggleEveningAll">全选</a-checkbox>
            </div>
            <a-checkbox-group v-model="form.startTimes" class="time-checkbox-group">
              <a-checkbox v-for="time in eveningTimes" :key="time" :value="time" class="time-checkbox">
                {{ time }}
              </a-checkbox>
            </a-checkbox-group>
          </div>
        </div>
      </a-form-item>
      
      <a-form-item label="课程时长(分钟)" field="durationMinutes" required>
        <a-input-number
          v-model="form.durationMinutes"
          placeholder="请输入课程时长"
          :min="1"
          :max="180"
          style="width: 100%"
        />
      </a-form-item>
      
      <a-form-item label="最大学生数" field="maxStudents" required>
        <a-input-number
          v-model="form.maxStudents"
          placeholder="请输入最大学生数"
          :min="1"
          :max="10"
          style="width: 100%"
        />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" :loading="saving" @click="save">确定</a-button>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import { getFixed, checkTimeConflict, batchAddFixed, listFixedByTeacherId } from '@/apis/education/fixed'
import { listTeacher } from '@/apis/education/teacher'

const props = defineProps<{
  teacherId?: string
}>()

const emits = defineEmits<{
  'save-success': []
}>()

const visible = ref(false)
const title = ref('')
const formRef = ref<FormInstance>()
const isUpdate = ref(false)
const id = ref('')
const saving = ref(false)
const teacherLoading = ref(false)
const teacherList = ref<any[]>([])
const teacherFixedList = ref<any[]>([]) // 存储教师的所有固定课

const form = reactive({
  teacherId: '',
  weekDays: [] as number[],
  startTimes: [] as string[],
  durationMinutes: 25,
  maxStudents: 1
})

// 时间段定义
const morningTimes = ['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
const afternoonTimes = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30']
const eveningTimes = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30']

// 全选状态
const morningAllSelected = ref(false)
const afternoonAllSelected = ref(false)
const eveningAllSelected = ref(false)

// 全选切换
const toggleMorningAll = (checked: boolean) => {
  if (checked) {
    const uniqueTimes = new Set([...form.startTimes, ...morningTimes])
    form.startTimes = Array.from(uniqueTimes)
  } else {
    form.startTimes = form.startTimes.filter(t => !morningTimes.includes(t))
  }
}

const toggleAfternoonAll = (checked: boolean) => {
  if (checked) {
    const uniqueTimes = new Set([...form.startTimes, ...afternoonTimes])
    form.startTimes = Array.from(uniqueTimes)
  } else {
    form.startTimes = form.startTimes.filter(t => !afternoonTimes.includes(t))
  }
}

const toggleEveningAll = (checked: boolean) => {
  if (checked) {
    const uniqueTimes = new Set([...form.startTimes, ...eveningTimes])
    form.startTimes = Array.from(uniqueTimes)
  } else {
    form.startTimes = form.startTimes.filter(t => !eveningTimes.includes(t))
  }
}

// 更新全选状态
const updateSelectAllStatus = () => {
  morningAllSelected.value = morningTimes.every(t => form.startTimes.includes(t))
  afternoonAllSelected.value = afternoonTimes.every(t => form.startTimes.includes(t))
  eveningAllSelected.value = eveningTimes.every(t => form.startTimes.includes(t))
}

// 监听星期选择变化，自动选择对应的时间
watch(() => form.weekDays, (newWeekDays) => {
  if (!teacherFixedList.value || teacherFixedList.value.length === 0) {
    return
  }
  
  if (newWeekDays.length === 0) {
    // 没有选择星期，清空时间
    form.startTimes = []
    updateSelectAllStatus()
    return
  }
  
  if (newWeekDays.length === 1) {
    // 只选择了一个星期，显示该星期的所有时间
    const weekDay = newWeekDays[0]
    const timesForWeek = teacherFixedList.value
      .filter((f: any) => f.weekDay === weekDay)
      .map((f: any) => f.startTime)
    form.startTimes = [...new Set(timesForWeek)]
  } else {
    // 选择了多个星期，计算交集（笛卡尔积）
    // 获取每个星期的时间列表
    const timesByWeekDay = newWeekDays.map(weekDay => {
      return teacherFixedList.value
        .filter((f: any) => f.weekDay === weekDay)
        .map((f: any) => f.startTime)
    })
    
    // 计算所有星期时间的并集（笛卡尔积）
    const allTimes = new Set<string>()
    timesByWeekDay.forEach(times => {
      times.forEach(time => allTimes.add(time))
    })
    
    form.startTimes = Array.from(allTimes).sort()
  }
  
  updateSelectAllStatus()
}, { deep: true })

const rules = computed(() => ({
  teacherId: [
    { required: !props.teacherId, message: '请选择教师' }
  ],
  weekDays: [
    { required: true, type: 'array', minLength: 1, message: '请至少选择一个星期' }
  ],
  startTimes: [
    { required: true, type: 'array', minLength: 1, message: '请至少选择一个时间' }
  ],
  durationMinutes: [
    { required: true, message: '请输入课程时长' }
  ],
  maxStudents: [
    { required: true, message: '请输入最大学生数' }
  ]
}))

// 加载教师列表
const loadTeachers = async (name?: string) => {
  try {
    teacherLoading.value = true
    const res = await listTeacher({
      name,
      page: 1,
      size: 100
    })
    teacherList.value = res.list || []
  } catch (error) {
    console.error('加载教师列表失败:', error)
  } finally {
    teacherLoading.value = false
  }
}

// 搜索教师
const searchTeachers = (value: string) => {
  loadTeachers(value)
}

// 打开新增弹窗
const onAdd = async (weekDay?: number, startTime?: string) => {
  visible.value = true
  title.value = '新增固定课'
  isUpdate.value = false
  
  // 重置表单
  reset()
  
  // 使用传入的教师ID或加载教师列表
  if (props.teacherId) {
    form.teacherId = props.teacherId
    
    // 加载该教师已有的固定课数据，不预选任何星期和时间
    try {
      const res = await listFixedByTeacherId(props.teacherId)
      teacherFixedList.value = res.data || res || []
      
      // 不预选星期和时间，让用户手动选择
      // 当用户选择星期时，watch会自动选择对应的时间
    } catch (error) {
      console.error('加载已有固定课失败:', error)
      teacherFixedList.value = []
    }
  } else {
    loadTeachers()
    teacherFixedList.value = []
  }
  
  // 设置初始值（如果提供了参数，覆盖默认值）
  if (weekDay !== undefined) {
    form.weekDays = [weekDay]
  }
  if (startTime) {
    form.startTimes = [startTime]
  }
}

// 打开修改弹窗
const onUpdate = async (recordId: string) => {
  visible.value = true
  title.value = '修改固定课'
  isUpdate.value = true
  id.value = recordId
  
  try {
    if (!props.teacherId) {
      await loadTeachers()
    }
    const res = await getFixed(recordId)
    const data = res.data || res
    form.teacherId = data.teacherId
    // 单个固定课编辑，转换为数组格式
    form.weekDays = [data.weekDay]
    form.startTimes = [data.startTime]
    form.durationMinutes = data.durationMinutes
    form.maxStudents = data.maxStudents
  } catch (error) {
    Message.error('加载数据失败')
    visible.value = false
  }
}

// 保存
const save = async () => {
  console.log('开始保存，表单数据:', form)
  
  if (saving.value) return
  
  try {
    await formRef.value?.validate()
    console.log('表单验证通过')
  } catch (error) {
    console.error('表单验证失败:', error)
    return
  }
  
  saving.value = true
  
  try {
    console.log('调用API保存...')
    if (isUpdate.value) {
      // 更新模式暂时不支持批量，需要后续改进
      Message.warning('编辑模式暂不支持批量修改')
      saving.value = false
      return
    } else {
      // 批量创建固定课（后端会自动跳过已存在的课程）
      const res = await batchAddFixed({
        teacherId: form.teacherId,
        weekDays: form.weekDays,
        startTimes: form.startTimes,
        durationMinutes: form.durationMinutes,
        maxStudents: form.maxStudents
      })
      
      const createdCount = res.data || res
      console.log('批量添加成功，创建了', createdCount, '个固定课')
      
      const totalCount = form.weekDays.length * form.startTimes.length
      const skippedCount = totalCount - createdCount
      
      if (skippedCount > 0) {
        Message.success(`成功创建 ${createdCount} 个固定课，跳过 ${skippedCount} 个已存在的课程`)
      } else {
        Message.success(`成功创建 ${createdCount} 个固定课`)
      }
    }
    visible.value = false
    emits('save-success')
    reset()
  } catch (error) {
    console.error('保存失败:', error)
    Message.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 关闭抽屉
const handleCancel = () => {
  visible.value = false
  reset()
}

// 重置
const reset = () => {
  form.teacherId = props.teacherId || ''
  form.weekDays = []
  form.startTimes = []
  form.durationMinutes = 25
  form.maxStudents = 1
  morningAllSelected.value = false
  afternoonAllSelected.value = false
  eveningAllSelected.value = false
  formRef.value?.clearValidate()
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss">
.time-sections-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 24px;
}

.time-section {
  display: block;
  width: 100%;
  
  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    gap: 8px;
    width: 100%;
    
    .section-title {
      font-size: 14px;
      color: var(--color-text-1);
    }
  }
  
  .time-checkbox-group {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    width: 100%;
    
    .time-checkbox {
      margin: 0;
      
      :deep(.arco-checkbox) {
        width: 100%;
        height: 36px;
        margin: 0;
        padding: 0;
        border: 1px solid var(--color-border-2);
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .arco-checkbox-icon {
          display: none;
        }
        
        .arco-checkbox-label {
          padding: 0;
          font-size: 14px;
          color: var(--color-text-2);
        }
        
        &:hover {
          border-color: rgb(var(--primary-6));
          background-color: var(--color-fill-1);
        }
        
        &.arco-checkbox-checked {
          border-color: rgb(var(--primary-6));
          background-color: rgb(var(--primary-1));
          
          .arco-checkbox-label {
            color: rgb(var(--primary-6));
          }
        }
      }
    }
  }
}
</style>
