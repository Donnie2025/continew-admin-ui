<template>
  <a-modal
    v-model:visible="visible"
    :title="`关联老师 - ${courseName}`"
    width="1000px"
    :mask-closable="false"
    :esc-to-close="false"
    unmount-on-close
    @before-ok="handleSave"
    @cancel="handleCancel"
  >
    <div class="teacher-modal-container">
      <!-- 左侧：可选老师列表 -->
      <div class="teacher-list-section">
        <div class="section-header">
          <span class="section-title">老师 ({{ availableTeachers.length }})</span>
          <a-input-search
            v-model="searchKeyword"
            placeholder="姓名/手机号/邮箱"
            allow-clear
            style="width: 240px"
            @search="loadTeachers"
            @clear="loadTeachers"
          />
        </div>
        <a-spin :loading="teacherLoading" style="width: 100%">
          <div class="teacher-table">
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
                v-for="teacher in availableTeachers"
                :key="teacher.id"
                class="table-row"
                @click="handleToggleTeacher(teacher.id)"
              >
                <div class="table-cell checkbox-cell">
                  <a-checkbox :model-value="selectedTeacherIds.includes(teacher.id)" />
                </div>
                <div class="table-cell name-cell">{{ teacher.name }}</div>
                <div class="table-cell contact-cell">{{ teacher.phone || teacher.email || '-' }}</div>
              </div>
              <a-empty v-if="availableTeachers.length === 0" style="margin-top: 40px">
                <template #description>
                  <span v-if="searchKeyword">未找到匹配"{{ searchKeyword }}"的老师</span>
                  <span v-else>暂无可选老师</span>
                </template>
              </a-empty>
              <!-- 滚动提示 -->
              <div v-if="availableTeachers.length > 10" class="scroll-hint">
                <icon-down /> 下滚查看更多老师
              </div>
            </div>
          </div>
        </a-spin>
      </div>

      <!-- 右侧：已选择的老师 -->
      <div class="selected-section">
        <div class="section-header">
          <span class="section-title">已选 ({{ totalSelectedCount }})</span>
          <a-link v-if="totalSelectedCount > 0" @click="handleClearAll">全部移除</a-link>
        </div>
        <a-spin :loading="loading" style="width: 100%">
          <div class="selected-list">
            <!-- 已关联的老师 -->
            <div v-for="teacher in courseTeachers" :key="'exist-' + teacher.teacherId" class="selected-item exist-item">
              <a-avatar :size="32">
                <icon-user />
              </a-avatar>
              <div class="item-info">
                <div class="item-name">{{ teacher.teacherName }}</div>
                <div class="item-detail">{{ teacher.teacherPhone || teacher.teacherEmail || `ID: ${teacher.teacherId}` }}</div>
              </div>
              <a-popconfirm content="确定要移除该老师吗？" @ok="handleRemoveTeacher(teacher.teacherId)">
                <icon-close class="remove-icon" />
              </a-popconfirm>
            </div>
            <!-- 新选择的老师 -->
            <div
              v-for="teacherId in selectedTeacherIds"
              :key="'new-' + teacherId"
              class="selected-item"
            >
              <a-avatar :size="32">
                <icon-user />
              </a-avatar>
              <div class="item-info">
                <div class="item-name">{{ getTeacherName(teacherId) }}</div>
                <div class="item-detail">{{ getTeacherPhone(teacherId) }}</div>
              </div>
              <icon-close class="remove-icon" @click="handleRemoveSelected(teacherId)" />
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
import { IconUser, IconClose, IconDown } from '@arco-design/web-vue/es/icon'
import {
  listCourseTeachers,
  addTeachersToCourse,
  removeTeacherFromCourse,
  type CourseTeacherResp
} from '@/apis/education/course'
import { listActiveTeachers, type TeacherResp } from '@/apis/education/teacher'

const visible = ref(false)
const loading = ref(false)
const teacherLoading = ref(false)
const courseId = ref('')
const courseName = ref('')
const searchKeyword = ref('')
const selectedTeacherIds = ref<number[]>([])
const courseTeachers = ref<CourseTeacherResp[]>([])
const availableTeachers = ref<TeacherResp[]>([])

const emit = defineEmits<{
  saveSuccess: []
}>()

// 计算总选择数量
const totalSelectedCount = computed(() => {
  return courseTeachers.value.length + selectedTeacherIds.value.length
})

// 是否全选
const isAllSelected = computed(() => {
  return availableTeachers.value.length > 0 && 
         selectedTeacherIds.value.length === availableTeachers.value.length
})

// 是否部分选择
const isSomeSelected = computed(() => {
  return selectedTeacherIds.value.length > 0 && 
         selectedTeacherIds.value.length < availableTeachers.value.length
})

// 全选/取消全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedTeacherIds.value = availableTeachers.value.map(t => t.id)
  } else {
    selectedTeacherIds.value = []
  }
}

// 切换选择
const handleToggleTeacher = (teacherId: number) => {
  const index = selectedTeacherIds.value.indexOf(teacherId)
  if (index > -1) {
    selectedTeacherIds.value.splice(index, 1)
  } else {
    selectedTeacherIds.value.push(teacherId)
  }
}

// 移除已选择的老师
const handleRemoveSelected = (teacherId: number) => {
  const index = selectedTeacherIds.value.indexOf(teacherId)
  if (index > -1) {
    selectedTeacherIds.value.splice(index, 1)
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
        // 1. 清空新选择的老师
        selectedTeacherIds.value = []
        
        // 2. 删除所有已关联的老师
        if (courseTeachers.value.length > 0) {
          // 逐个删除已关联的老师
          const deletePromises = courseTeachers.value.map(teacher => 
            removeTeacherFromCourse(courseId.value, String(teacher.teacherId))
          )
          await Promise.all(deletePromises)
          Message.success('全部移除成功')
          
          // 3. 重新加载数据
          await loadCourseTeachers()
          await loadTeachers()
          
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

// 获取老师姓名
const getTeacherName = (teacherId: number) => {
  const teacher = availableTeachers.value.find(t => t.id === teacherId)
  return teacher?.name || ''
}

// 获取老师手机号
const getTeacherPhone = (teacherId: number) => {
  const teacher = availableTeachers.value.find(t => t.id === teacherId)
  return teacher?.phone || teacher?.email || ''
}

// 打开弹窗
const onOpen = async (id: string, name: string) => {
  courseId.value = id
  courseName.value = name
  visible.value = true
  selectedTeacherIds.value = []
  // 先加载已关联的老师，再加载可选老师列表
  await loadCourseTeachers()
  await loadTeachers()
}

// 加载班级已关联的老师
const loadCourseTeachers = async () => {
  loading.value = true
  try {
    const response = await listCourseTeachers(courseId.value)
    console.log('已关联老师API响应:', response)
    // 从响应中提取数据数组
    const result = Array.isArray(response) ? response : (response?.data || [])
    courseTeachers.value = result
    console.log('已关联老师列表:', courseTeachers.value)
  } catch (error) {
    console.error('加载已关联老师失败:', error)
    courseTeachers.value = []
  } finally {
    loading.value = false
  }
}

// 加载可选老师列表
const loadTeachers = async () => {
  teacherLoading.value = true
  try {
    const keyword = searchKeyword.value.trim()
    console.log('搜索关键词:', keyword)
    const response = await listActiveTeachers(keyword || undefined)
    console.log('API响应:', response)
    
    // 从响应中提取数据数组
    const teachers = Array.isArray(response) ? response : (response?.data || [])
    console.log('老师列表数据:', teachers)
    console.log('老师数量:', teachers.length)
    
    // 确保 courseTeachers.value 是数组
    if (!Array.isArray(courseTeachers.value)) {
      courseTeachers.value = []
    }
    
    // 过滤掉已关联的老师
    const existingTeacherIds = courseTeachers.value.map(t => Number(t.teacherId))
    console.log('已关联的老师ID列表:', existingTeacherIds)
    
    availableTeachers.value = teachers.filter(t => {
      const teacherId = Number(t.id)
      const isExisting = existingTeacherIds.includes(teacherId)
      return !isExisting
    })
    
    console.log('过滤后的可选老师列表:', availableTeachers.value)
    console.log('可选老师数量:', availableTeachers.value.length)
  } catch (error) {
    console.error('加载可选老师失败:', error)
    availableTeachers.value = []
  } finally {
    teacherLoading.value = false
  }
}

// 移除老师
const handleRemoveTeacher = async (teacherId: string) => {
  try {
    await removeTeacherFromCourse(courseId.value, teacherId)
    Message.success('移除成功')
    await Promise.all([loadCourseTeachers(), loadTeachers()])
    emit('saveSuccess')
  } catch (error) {
    console.error('移除老师失败:', error)
  }
}

// 保存
const handleSave = async () => {
  if (selectedTeacherIds.value.length === 0) {
    Message.warning('请选择要添加的老师')
    return false
  }

  try {
    await addTeachersToCourse({
      courseId: courseId.value,
      teacherIds: selectedTeacherIds.value.map(id => String(id))
    })
    Message.success('添加成功')
    selectedTeacherIds.value = []
    await Promise.all([loadCourseTeachers(), loadTeachers()])
    emit('saveSuccess')
    return true
  } catch (error) {
    console.error('添加老师失败:', error)
    return false
  }
}

// 取消
const handleCancel = () => {
  visible.value = false
  courseId.value = ''
  courseName.value = ''
  searchKeyword.value = ''
  selectedTeacherIds.value = []
  courseTeachers.value = []
  availableTeachers.value = []
}

defineExpose({
  onOpen
})
</script>

<style scoped lang="scss">
.teacher-modal-container {
  display: flex;
  gap: 16px;
  height: 520px;
}

.teacher-list-section {
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

.teacher-table {
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
  max-height: 400px; /* 设置最大高度，确保滚动条显示 */
  scrollbar-width: thin; /* Firefox */
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

/* 滚动提示样式 */
.scroll-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  color: var(--color-text-3);
  font-size: 12px;
  background-color: var(--color-fill-1);
  border-top: 1px solid var(--color-border-2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

/* WebKit浏览器的滚动条样式 */
.table-body::-webkit-scrollbar {
  width: 8px;
}

.table-body::-webkit-scrollbar-track {
  background: var(--color-fill-1);
}

.table-body::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 4px;
}

.table-body::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-4);
}
</style>

