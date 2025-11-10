<template>
  <a-modal
    v-model:visible="visible"
    :title="`关联学生 - ${courseName}`"
    width="1000px"
    :mask-closable="false"
    :esc-to-close="false"
    unmount-on-close
    @before-ok="handleSave"
    @cancel="handleCancel"
  >
    <div class="student-modal-container">
      <!-- 左侧：可选学生列表 -->
      <div class="student-list-section">
        <div class="section-header">
          <span class="section-title">学生 ({{ availableStudents.length }})</span>
          <a-input-search
            v-model="searchKeyword"
            placeholder="姓名/手机号/邮箱"
            allow-clear
            style="width: 240px"
            @search="loadStudents"
            @clear="loadStudents"
          />
        </div>
        <a-spin :loading="studentLoading" style="width: 100%">
          <div class="student-table">
            <div class="table-header">
              <div class="table-cell checkbox-cell">
                <a-checkbox
                  :model-value="isAllSelected"
                  :indeterminate="isSomeSelected"
                  @change="handleSelectAll"
                />
              </div>
              <div class="table-cell name-cell">姓名</div>
              <div class="table-cell contact-cell">手机号/邮箱</div>
            </div>
            <div class="table-body">
              <div
                v-for="student in availableStudents"
                :key="student.id"
                class="table-row"
                @click="handleToggleStudent(student.id)"
              >
                <div class="table-cell checkbox-cell">
                  <a-checkbox :model-value="selectedStudentIds.includes(student.id)" />
                </div>
                <div class="table-cell name-cell">{{ student.name }}</div>
                <div class="table-cell contact-cell">{{ student.phone || student.email || '-' }}</div>
              </div>
              <a-empty v-if="availableStudents.length === 0" style="margin-top: 40px">
                <template #description>
                  <span v-if="searchKeyword">未找到匹配"{{ searchKeyword }}"的学生</span>
                  <span v-else>暂无可选学生</span>
                </template>
              </a-empty>
            </div>
          </div>
        </a-spin>
      </div>

      <!-- 右侧：已选择的学生 -->
      <div class="selected-section">
        <div class="section-header">
          <span class="section-title">已选 ({{ totalSelectedCount }})</span>
          <a-link v-if="totalSelectedCount > 0" @click="handleClearAll">全部移除</a-link>
        </div>
        <a-spin :loading="loading" style="width: 100%">
          <div class="selected-list">
            <!-- 已关联的学生 -->
            <div v-for="student in courseStudents" :key="'exist-' + student.studentId" class="selected-item exist-item">
              <a-avatar :size="32">
                <icon-user />
              </a-avatar>
              <div class="item-info">
                <div class="item-name">{{ student.studentName }}</div>
                <div class="item-detail">{{ student.studentPhone || student.studentEmail || `ID: ${student.studentId}` }}</div>
              </div>
              <a-popconfirm content="确定要移除该学生吗？" @ok="handleRemoveStudent(student.studentId)">
                <icon-close class="remove-icon" />
              </a-popconfirm>
            </div>
            <!-- 新选择的学生 -->
            <div
              v-for="studentId in selectedStudentIds"
              :key="'new-' + studentId"
              class="selected-item"
            >
              <a-avatar :size="32">
                <icon-user />
              </a-avatar>
              <div class="item-info">
                <div class="item-name">{{ getStudentName(studentId) }}</div>
                <div class="item-detail">{{ getStudentPhone(studentId) }}</div>
              </div>
              <icon-close class="remove-icon" @click="handleRemoveSelected(studentId)" />
            </div>
            <a-empty v-if="totalSelectedCount === 0" description="暂无选择" style="margin-top: 60px" />
          </div>
        </a-spin>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { Message, Modal } from '@arco-design/web-vue'
import { IconUser, IconClose } from '@arco-design/web-vue/es/icon'
import {
  listCourseStudents,
  addStudentsToCourse,
  removeStudentFromCourse,
  type CourseStudentResp
} from '@/apis/education/course'
import { listStudent, type StudentResp } from '@/apis/education/student'

const visible = ref(false)
const loading = ref(false)
const studentLoading = ref(false)
const courseId = ref('')
const courseName = ref('')
const searchKeyword = ref('')
const selectedStudentIds = ref<string[]>([])
const courseStudents = ref<CourseStudentResp[]>([])
const availableStudents = ref<StudentResp[]>([])

const emit = defineEmits<{
  saveSuccess: []
}>()

// 计算总选择数量
const totalSelectedCount = computed(() => {
  return courseStudents.value.length + selectedStudentIds.value.length
})

// 是否全选
const isAllSelected = computed(() => {
  return availableStudents.value.length > 0 && 
         selectedStudentIds.value.length === availableStudents.value.length
})

// 是否部分选择
const isSomeSelected = computed(() => {
  return selectedStudentIds.value.length > 0 && 
         selectedStudentIds.value.length < availableStudents.value.length
})

// 全选/取消全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedStudentIds.value = availableStudents.value.map(s => s.id)
  } else {
    selectedStudentIds.value = []
  }
}

// 切换选择
const handleToggleStudent = (studentId: string) => {
  const index = selectedStudentIds.value.indexOf(studentId)
  if (index > -1) {
    selectedStudentIds.value.splice(index, 1)
  } else {
    selectedStudentIds.value.push(studentId)
  }
}

// 移除已选择的学生
const handleRemoveSelected = (studentId: string) => {
  const index = selectedStudentIds.value.indexOf(studentId)
  if (index > -1) {
    selectedStudentIds.value.splice(index, 1)
  }
}

// 清空所有选择
const handleClearAll = () => {
  Modal.confirm({
    title: '提示',
    content: '确定要全部移除吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 1. 清空新选择的学生
        selectedStudentIds.value = []
        
        // 2. 删除所有已关联的学生
        if (courseStudents.value.length > 0) {
          // 逐个删除已关联的学生
          const deletePromises = courseStudents.value.map(student => 
            removeStudentFromCourse(courseId.value, String(student.studentId))
          )
          await Promise.all(deletePromises)
          Message.success('全部移除成功')
          
          // 3. 重新加载数据
          await loadCourseStudents()
          await loadStudents()
          
          // 4. 通知父组件刷新
          emit('saveSuccess')
        } else {
          Message.success('已清空选择')
        }
      } catch (error) {
        console.error('全部移除失败:', error)
        Message.error('全部移除失败')
      }
    }
  })
}

// 获取学生姓名
const getStudentName = (studentId: string) => {
  const student = availableStudents.value.find(s => s.id === studentId)
  return student?.name || ''
}

// 获取学生手机号
const getStudentPhone = (studentId: string) => {
  const student = availableStudents.value.find(s => s.id === studentId)
  return student?.phone || student?.email || ''
}

// 打开弹窗
const onOpen = async (id: string, name: string) => {
  courseId.value = id
  courseName.value = name
  visible.value = true
  selectedStudentIds.value = []
  // 先加载已关联的学生，再加载可选学生列表
  await loadCourseStudents()
  await loadStudents()
}

// 加载班级已关联的学生
const loadCourseStudents = async () => {
  loading.value = true
  try {
    const response = await listCourseStudents(courseId.value)
    console.log('已关联学生API响应:', response)
    // 从响应中提取数据数组
    const result = Array.isArray(response) ? response : (response?.data || [])
    courseStudents.value = result
    console.log('已关联学生列表:', courseStudents.value)
  } catch (error) {
    console.error('加载已关联学生失败:', error)
    courseStudents.value = []
  } finally {
    loading.value = false
  }
}

// 加载可选学生列表
const loadStudents = async () => {
  studentLoading.value = true
  try {
    const keyword = searchKeyword.value.trim()
    console.log('搜索关键词:', keyword)
    const response = await listStudent({
      name: keyword || undefined,
      phone: undefined,
      sort: ['id,desc'],
      page: 1,
      size: 100
    })
    console.log('学生列表API响应:', response)
    
    // 从响应中提取数据数组（学生列表返回的是分页对象，数据在 data.list 中）
    const studentList = response?.data?.list || response?.list || []
    console.log('学生列表数据:', studentList)
    console.log('学生数量:', studentList.length)
    
    // 确保 courseStudents.value 是数组
    if (!Array.isArray(courseStudents.value)) {
      courseStudents.value = []
    }
    
    // 过滤掉已关联的学生
    const existingStudentIds = courseStudents.value.map(s => String(s.studentId))
    console.log('已关联的学生ID列表:', existingStudentIds)
    
    availableStudents.value = studentList.filter(s => {
      const studentId = String(s.id)
      const isExisting = existingStudentIds.includes(studentId)
      return !isExisting
    })
    
    console.log('过滤后的可选学生列表:', availableStudents.value)
    console.log('可选学生数量:', availableStudents.value.length)
  } catch (error) {
    console.error('加载可选学生失败:', error)
    availableStudents.value = []
  } finally {
    studentLoading.value = false
  }
}

// 移除学生
const handleRemoveStudent = async (studentId: string) => {
  try {
    await removeStudentFromCourse(courseId.value, studentId)
    Message.success('移除成功')
    await Promise.all([loadCourseStudents(), loadStudents()])
    emit('saveSuccess')
  } catch (error) {
    console.error('移除学生失败:', error)
  }
}

// 保存
const handleSave = async () => {
  if (selectedStudentIds.value.length === 0) {
    Message.warning('请选择要添加的学生')
    return false
  }

  try {
    await addStudentsToCourse({
      courseId: courseId.value,
      studentIds: selectedStudentIds.value
    })
    Message.success('添加成功')
    selectedStudentIds.value = []
    await Promise.all([loadCourseStudents(), loadStudents()])
    emit('saveSuccess')
    return true
  } catch (error) {
    console.error('添加学生失败:', error)
    return false
  }
}

// 取消
const handleCancel = () => {
  visible.value = false
  courseId.value = ''
  courseName.value = ''
  searchKeyword.value = ''
  selectedStudentIds.value = []
  courseStudents.value = []
  availableStudents.value = []
}

defineExpose({
  onOpen
})
</script>

<style scoped lang="scss">
.student-modal-container {
  display: flex;
  gap: 16px;
  height: 520px;
}

.student-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  overflow: hidden;
}

.selected-section {
  width: 280px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-2);
  background-color: var(--color-fill-1);
}

.section-title {
  font-weight: 500;
  font-size: 14px;
}

.student-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--color-fill-2);
  border-bottom: 1px solid var(--color-border-2);
  font-weight: 500;
  font-size: 13px;
}

.table-body {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
  
  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--color-fill-2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-fill-4);
    border-radius: 4px;
    
    &:hover {
      background: var(--color-text-4);
    }
  }
}

.table-row {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid var(--color-border-1);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-fill-1);
  }
}

.table-cell {
  font-size: 13px;
}

.checkbox-cell {
  width: 40px;
  flex-shrink: 0;
}

.name-cell {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-cell {
  width: 180px;
  flex-shrink: 0;
  color: var(--color-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: 440px;
  
  /* 美化滚动条 */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--color-fill-2);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--color-fill-4);
    border-radius: 4px;
    
    &:hover {
      background: var(--color-text-4);
    }
  }
}

.selected-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background-color: var(--color-fill-1);
  border-radius: 4px;
  transition: background-color 0.2s;

  &.exist-item {
    background-color: var(--color-primary-light-1);
  }

  &:hover {
    background-color: var(--color-fill-2);

    .remove-icon {
      opacity: 1;
    }
  }
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-detail {
  font-size: 12px;
  color: var(--color-text-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-icon {
  font-size: 14px;
  color: var(--color-text-3);
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: var(--color-danger-6);
    opacity: 1;
  }
}

:deep(.arco-spin) {
  display: flex;
  flex-direction: column;
}
</style>
