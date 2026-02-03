<template>
  <a-drawer
    v-model:visible="visible"
    title="固定课详情"
    width="520px"
    :footer="false"
    unmount-on-close
    @cancel="handleCancel"
  >
    <a-descriptions :column="1" bordered size="large">
      <a-descriptions-item label="教师姓名">
        <a-tag color="blue">{{ detail.teacherName }}</a-tag>
      </a-descriptions-item>
      
      <a-descriptions-item label="星期">
        <a-tag :color="getWeekDayColor(detail.weekDay)">{{ getWeekDayText(detail.weekDay) }}</a-tag>
      </a-descriptions-item>
      
      <a-descriptions-item label="上课时间">
        <a-tag color="arcoblue">{{ detail.startTime }}</a-tag>
      </a-descriptions-item>
  
    </a-descriptions>

    <a-divider />

    <!-- 学生管理 -->
    <div class="student-management">
      <div class="section-header">
        <h3>学生管理</h3>
        <a-button 
          v-if="detail.bookedCount < detail.maxStudents"
          type="primary" 
          size="small" 
          @click="showAddStudent = true"
        >
          <template #icon>
            <icon-plus />
          </template>
          添加学生
        </a-button>
      </div>

      <div v-if="students.length > 0" class="student-items">
        <div v-for="student in students" :key="student.id" class="student-item">
          <div class="student-info">
            <icon-user class="student-icon" />
            <div class="student-details">
              <div class="student-name">{{ student.studentName }}</div>
              <div class="student-meta">{{ student.studentPhone || '暂无手机号' }}</div>
            </div>
          </div>
          <a-button type="text" status="danger" size="small" @click="handleRemoveStudent(student)">
            取消预约
          </a-button>
        </div>
      </div>

      <a-empty v-else description="暂无学生预约" style="margin: 20px 0" />
    </div>

    <!-- 添加学生弹窗 -->
    <a-modal
      v-model:visible="showAddStudent"
      title="添加学生"
      @before-ok="handleAddStudent"
      @cancel="resetAddForm"
      @open="onAddStudentModalOpen"
    >
      <a-form :model="addForm" layout="vertical">
        <a-form-item label="选择学生" field="studentId" required>
          <a-select
            v-model="addForm.studentId"
            placeholder="请选择学生"
            allow-search
            :loading="studentLoading"
            @search="searchStudents"
          >
            <a-option v-for="student in studentList" :key="student.id" :value="student.id">
              {{ student.name }} ({{ student.phone }})
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-drawer>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { IconPlus, IconUser } from '@arco-design/web-vue/es/icon'
import { getFixed, getFixedBookings, addFixedBooking, deleteFixedBooking, type FixedResp } from '@/apis/education/fixed'
import { listStudent } from '@/apis/education/student'

const visible = ref(false)
const detail = ref<FixedResp>({
  id: '',
  teacherId: '',
  teacherName: '',
  durationMinutes: 0,
  maxStudents: 0,
  weekDay: 1,
  startTime: '',
  status: 1,
  bookedCount: 0,
  studentNames: [],
  createTime: '',
  updateTime: ''
})

const students = ref<any[]>([])
const showAddStudent = ref(false)
const studentLoading = ref(false)
const studentList = ref<any[]>([])
const lastSelectedStudentId = ref<string>('')
const addForm = reactive({
  studentId: ''
})

const emits = defineEmits(['refresh'])

// 获取星期文本
const getWeekDayText = (weekDay: number) => {
  const weekDayMap: Record<number, string> = {
    1: '周一',
    2: '周二',
    3: '周三',
    4: '周四',
    5: '周五',
    6: '周六',
    7: '周日'
  }
  return weekDayMap[weekDay] || ''
}

// 获取星期颜色
const getWeekDayColor = (weekDay: number) => {
  const colorMap: Record<number, string> = {
    1: 'blue',
    2: 'cyan',
    3: 'green',
    4: 'orange',
    5: 'purple',
    6: 'red',
    7: 'magenta'
  }
  return colorMap[weekDay] || 'gray'
}

// 打开抽屉
const onOpen = async (id: string) => {
  visible.value = true
  try {
    const res = await getFixed(id)
    detail.value = res.data || res
    console.log('Fixed detail loaded:', detail.value)
    // 使用传入的ID加载学生列表
    if (id) {
      await loadStudents(id)
    }
  } catch (error) {
    console.error('Load fixed detail failed:', error)
    Message.error('加载数据失败')
    visible.value = false
  }
}

// 加载已预约学生列表
const loadStudents = async (fixedId: string) => {
  try {
    console.log('Loading students for fixedId:', fixedId)
    const res = await getFixedBookings(fixedId)
    students.value = res.data || res || []
    console.log('Students loaded:', students.value)
  } catch (error) {
    console.error('加载学生列表失败:', error)
    students.value = []
  }
}

// 打开添加学生弹窗
const onAddStudentModalOpen = async () => {
  await searchStudents()
  // 如果有上次选择的学生，自动填入
  if (lastSelectedStudentId.value) {
    addForm.studentId = lastSelectedStudentId.value
  }
}

// 搜索学生
const searchStudents = async (name?: string) => {
  try {
    studentLoading.value = true
    const res = await listStudent({
      name,
      page: 1,
      size: 50
    })
    console.log('Student search response:', res)
    // 处理不同的响应结构
    if (res.data && res.data.list) {
      // 结构: { data: { list: [...] } }
      studentList.value = res.data.list
    } else if (res.list) {
      // 结构: { list: [...] }
      studentList.value = res.list
    } else if (Array.isArray(res)) {
      // 结构: [...]
      studentList.value = res
    } else {
      studentList.value = []
    }
    console.log('Student list:', studentList.value)
  } catch (error) {
    console.error('搜索学生失败:', error)
  } finally {
    studentLoading.value = false
  }
}

// 添加学生
const handleAddStudent = async () => {
  if (!addForm.studentId) {
    Message.warning('请选择学生')
    return false
  }
  
  const currentFixedId = detail.value.id
  if (!currentFixedId) {
    Message.error('固定课ID无效')
    return false
  }
  
  try {
    await addFixedBooking({
      fixedId: currentFixedId,
      studentId: addForm.studentId
    })
    // 保存当前选择的学生ID，下次默认使用
    lastSelectedStudentId.value = addForm.studentId
    Message.success('添加成功')
    showAddStudent.value = false
    resetAddForm()
    // 重新加载数据
    await loadStudents(currentFixedId)
    const res = await getFixed(currentFixedId)
    detail.value = res.data || res
    emits('refresh')
    return true
  } catch (error) {
    Message.error('添加失败')
    return false
  }
}

// 移除学生
const handleRemoveStudent = (student: any) => {
  const currentFixedId = detail.value.id
  if (!currentFixedId) {
    Message.error('固定课ID无效')
    return
  }
  
  Modal.confirm({
    title: '确认取消预约',
    content: `确定要取消 ${student.studentName} 的预约吗？`,
    onOk: async () => {
      try {
        await deleteFixedBooking(student.id)
        Message.success('取消成功')
        // 重新加载数据
        await loadStudents(currentFixedId)
        const res = await getFixed(currentFixedId)
        detail.value = res.data || res
        emits('refresh')
      } catch (error) {
        Message.error('取消失败')
      }
    }
  })
}

// 重置添加表单
const resetAddForm = () => {
  addForm.studentId = ''
  studentList.value = []
}

// 关闭抽屉
const handleCancel = () => {
  visible.value = false
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.student-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.student-management {
  margin-top: 16px;
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-text-1);
    }
  }
  
  .student-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .student-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--color-fill-1);
    border-radius: 8px;
    transition: all 0.2s;
    
    &:hover {
      background: var(--color-fill-2);
    }
    
    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .student-icon {
        font-size: 24px;
        color: var(--color-primary-6);
      }
      
      .student-details {
        .student-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-1);
          margin-bottom: 4px;
        }
        
        .student-meta {
          font-size: 12px;
          color: var(--color-text-3);
        }
      }
    }
  }
}
</style>
