<template>
  <a-modal
    v-model:visible="visible"
    :title="`班级【${courseName}】- 课节管理`"
    width="1200px"
    :mask-closable="false"
    :esc-to-close="false"
    unmount-on-close
    :footer="false"
    @cancel="handleCancel"
  >
    <div class="lesson-modal-container">
      <!-- 工具栏 -->
      <div class="toolbar">
        <a-input-search
          v-model="searchKeyword"
          placeholder="搜索课节名称"
          allow-clear
          style="width: 280px"
          @search="loadLessons"
          @clear="loadLessons"
        />
        <a-button type="primary" @click="onAddLesson">
          <template #icon><icon-plus /></template>
          新增课节
        </a-button>
      </div>

      <!-- 课节列表 -->
      <a-spin :loading="loading" style="width: 100%">
        <div class="lesson-table">
          <div class="table-header">
            <div class="table-cell index-cell">序号</div>
            <div class="table-cell name-cell">课节名称</div>
            <div class="table-cell time-cell">上课时间</div>
            <div class="table-cell duration-cell">时长</div>
            <div class="table-cell seat-cell">1对几</div>
            <div class="table-cell teacher-cell">主讲老师</div>
            <div class="table-cell record-cell">是否录制</div>
            <div class="table-cell action-cell">操作</div>
          </div>
          <div class="table-body">
            <div
              v-for="(lesson, index) in filteredLessons"
              :key="lesson.id"
              class="table-row"
            >
              <div class="table-cell index-cell">{{ index + 1 }}</div>
              <div class="table-cell name-cell" :title="lesson.name">{{ lesson.name }}</div>
              <div class="table-cell time-cell">{{ formatDateTime(lesson.startTime) }}</div>
              <div class="table-cell duration-cell">{{ formatDuration(lesson.duration) }}</div>
              <div class="table-cell seat-cell">1对{{ lesson.seatNum - 1 }}</div>
              <div class="table-cell teacher-cell">{{ lesson.teacherName || '-' }}</div>
              <div class="table-cell record-cell">
                <a-tag :color="lesson.recordState === 1 ? 'green' : 'gray'">
                  {{ lesson.recordState === 1 ? '是' : '否' }}
                </a-tag>
              </div>
              <div class="table-cell action-cell">
                <a-space>
                  <a-link @click="onEditLesson(lesson)">编辑</a-link>
                  <a-popconfirm content="确定要删除该课节吗？" @ok="handleDeleteLesson(lesson.id)">
                    <a-link status="danger">删除</a-link>
                  </a-popconfirm>
                </a-space>
              </div>
            </div>
            <a-empty v-if="filteredLessons.length === 0" style="margin-top: 40px">
              <template #description>
                <span v-if="searchKeyword">未找到匹配"{{ searchKeyword }}"的课节</span>
                <span v-else>暂无课节数据</span>
              </template>
            </a-empty>
          </div>
        </div>
      </a-spin>
    </div>

    <!-- 新增/编辑课节弹窗 -->
    <a-modal
      v-model:visible="formVisible"
      :title="isEdit ? '编辑课节' : '新增课节'"
      width="600px"
      :mask-closable="false"
      @before-ok="handleSaveLesson"
      @cancel="handleCancelForm"
    >
      <a-form :model="lessonForm" ref="lessonFormRef" layout="vertical">
        <a-form-item
          label="课节名称"
          field="name"
          :rules="[{ required: true, message: '请输入课节名称' }]"
        >
          <a-input v-model="lessonForm.name" placeholder="请输入课节名称" :max-length="50" show-word-limit />
        </a-form-item>
        
        <a-form-item
          label="上课时间"
          field="startTime"
          :rules="[{ required: true, message: '请选择上课时间' }]"
        >
          <a-date-picker
            v-model="lessonForm.startTime"
            show-time
            format="YYYY-MM-DD HH:mm"
            placeholder="请选择上课时间"
            style="width: 100%"
            :time-picker-props="{
              hideDisabledOptions: true,
              disabledMinutes: () => {
                return Array.from({ length: 60 }, (_, i) => i).filter(i => i % 10 !== 0)
              }
            }"
          />
        </a-form-item>
        
        <a-form-item label="课堂时长">
          <div style="display: flex; align-items: center; gap: 8px;">
            <a-select v-model="lessonForm.durationHours" placeholder="小时" style="width: 120px;">
              <a-option v-for="h in 24" :key="h - 1" :value="h - 1">{{ h - 1 }}</a-option>
            </a-select>
            <span>小时</span>
            <a-select v-model="lessonForm.durationMinutes" placeholder="分钟" style="width: 120px;">
              <a-option :value="0">0</a-option>
              <a-option :value="10">10</a-option>
              <a-option :value="20">20</a-option>
              <a-option :value="25">25</a-option>
              <a-option :value="30">30</a-option>
              <a-option :value="40">40</a-option>
              <a-option :value="50">50</a-option>
            </a-select>
            <span>分钟</span>
          </div>
          <div style="color: #86909c; font-size: 12px; margin-top: 4px;">
            课堂时长至少为10分钟
          </div>
        </a-form-item>
        
        <a-form-item
          label="教学形式（1对几）"
          field="seatNum"
          :rules="[{ required: true, message: '请选择教学形式' }]"
        >
          <a-select v-model="lessonForm.seatNum" placeholder="请选择1对几">
            <a-option v-for="n in 12" :key="n" :value="n + 1">1对{{ n }}</a-option>
          </a-select>
        </a-form-item>
        
        <a-form-item
          label="主讲老师"
          field="teacherName"
          :rules="[{ required: true, message: '请选择主讲老师' }]"
        >
          <a-auto-complete
            v-model="lessonForm.teacherName"
            :data="teacherOptions"
            :loading="teacherLoading"
            :filter-option="false"
            placeholder="请输入教师姓名或手机号搜索"
            allow-clear
            @search="handleSearchTeacher"
            @select="handleSelectTeacher"
            @clear="handleClearTeacher"
          />
        </a-form-item>
        
        <a-form-item label="是否录制" field="recordState">
          <a-switch v-model="lessonForm.recordState" :checked-value="1" :unchecked-value="0">
            <template #checked>是</template>
            <template #unchecked>否</template>
          </a-switch>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import { IconPlus } from '@arco-design/web-vue/es/icon'
import {
  listCourseLessons,
  addLesson,
  updateLesson,
  deleteLesson,
  type LessonResp
} from '@/apis/education/lesson'
import { searchTeachers, type TeacherResp } from '@/apis/education/teacher'
import { getCourse } from '@/apis/education/course'

const visible = ref(false)
const loading = ref(false)
const formVisible = ref(false)
const teacherLoading = ref(false)
const courseId = ref('')
const courseName = ref('')
const courseUid = ref('')
const searchKeyword = ref('')
const isEdit = ref(false)
const editingLessonId = ref('')

const lessons = ref<LessonResp[]>([])
const lessonFormRef = ref()

// 教师搜索
const teacherOptions = ref<{ label: string; value: string; id: number | string }[]>([])

const emit = defineEmits<{
  saveSuccess: []
}>()

// 课节表单
const lessonForm = ref({
  name: '',
  startTime: '',
  durationHours: 0,
  durationMinutes: 30,
  seatNum: 2, // 默认1对1，值为2
  teacherId: '',
  teacherName: '', // 用于显示教师名字
  recordState: 0
})

// 过滤后的课节列表
const filteredLessons = computed(() => {
  if (!searchKeyword.value) {
    return lessons.value
  }
  return lessons.value.filter(lesson =>
    lesson.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 格式化日期时间
const formatDateTime = (datetime: string) => {
  if (!datetime) return '-'
  const date = new Date(datetime)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 格式化时长
const formatDuration = (minutes: string | number) => {
  if (!minutes) return '-'
  const totalMinutes = typeof minutes === 'string' ? parseInt(minutes) : minutes
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`
  } else if (hours > 0) {
    return `${hours}小时`
  } else {
    return `${mins}分钟`
  }
}

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
    lessonForm.value.teacherName = selectedTeacher.value // 显示名字
    lessonForm.value.teacherId = String(selectedTeacher.id) // 表单存储ID
  }
}

// 清除教师
const handleClearTeacher = () => {
  lessonForm.value.teacherName = ''
  lessonForm.value.teacherId = ''
  teacherOptions.value = []
}

// 打开弹窗
const onOpen = async (id: string, name: string) => {
  courseId.value = id
  courseName.value = name
  visible.value = true
  searchKeyword.value = ''
  
  // 加载班级信息以获取courseUid
  await loadCourseInfo()
  // 加载课节列表
  await loadLessons()
}

// 加载班级信息
const loadCourseInfo = async () => {
  try {
    const { data } = await getCourse(courseId.value)
    courseUid.value = data.courseUid || ''
  } catch (error) {
    console.error('加载班级信息失败:', error)
  }
}

// 加载课节列表
const loadLessons = async () => {
  loading.value = true
  try {
    const { data } = await listCourseLessons(courseId.value)
    lessons.value = Array.isArray(data) ? data : []
  } catch (error) {
    console.error('加载课节列表失败:', error)
    lessons.value = []
  } finally {
    loading.value = false
  }
}

// 新增课节
const onAddLesson = () => {
  isEdit.value = false
  editingLessonId.value = ''
  lessonForm.value = {
    name: courseName.value, // 默认填充班级名称
    startTime: '',
    durationHours: 0,
    durationMinutes: 30,
    seatNum: 2,
    teacherId: '',
    teacherName: '',
    recordState: 0
  }
  teacherOptions.value = []
  formVisible.value = true
}

// 编辑课节
const onEditLesson = (lesson: LessonResp) => {
  isEdit.value = true
  editingLessonId.value = lesson.id
  
  // 从总分钟数拆分为小时和分钟
  const totalMinutes = typeof lesson.duration === 'string' ? parseInt(lesson.duration) : (lesson.duration || 0)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  lessonForm.value = {
    name: lesson.name,
    startTime: lesson.startTime,
    durationHours: hours,
    durationMinutes: minutes,
    seatNum: lesson.seatNum || 2,
    teacherId: lesson.teacherId || '',
    teacherName: lesson.teacherName || '', // 填充教师名字
    recordState: lesson.recordState || 0
  }
  
  // 如果有教师信息，预填充到选项中
  if (lesson.teacherName && lesson.teacherId) {
    teacherOptions.value = [{
      label: lesson.teacherName,
      value: lesson.teacherName,
      id: lesson.teacherId
    }]
  } else {
    teacherOptions.value = []
  }
  
  formVisible.value = true
}

// 保存课节
const handleSaveLesson = async () => {
  try {
    const valid = await lessonFormRef.value?.validate()
    if (!valid) return false
    
    // 验证时长（至少10分钟）
    const totalMinutes = lessonForm.value.durationHours * 60 + lessonForm.value.durationMinutes
    if (totalMinutes < 10) {
      Message.error('课堂时长至少为10分钟')
      return false
    }
    
    // 验证是否选择了教师
    if (!lessonForm.value.teacherId) {
      Message.error('请选择主讲老师')
      return false
    }
    
    // 准备提交数据
    const startTime = new Date(lessonForm.value.startTime)
    startTime.setSeconds(0)
    const endTime = new Date(startTime.getTime() + totalMinutes * 60 * 1000)
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:00`
    }
    
    const submitData = {
      courseId: courseId.value,
      courseUid: courseUid.value,
      name: lessonForm.value.name,
      teacherId: lessonForm.value.teacherId,
      startTime: formatDate(startTime),
      endTime: formatDate(endTime),
      duration: totalMinutes,
      seatNum: lessonForm.value.seatNum,
      recordState: lessonForm.value.recordState,
      liveState: 0,
      openState: 0
    }
    
    if (isEdit.value) {
      await updateLesson(submitData, editingLessonId.value)
      Message.success('修改成功')
    } else {
      await addLesson(submitData)
      Message.success('新增成功')
    }
    
    formVisible.value = false
    await loadLessons()
    emit('saveSuccess')
    return true
  } catch (error) {
    console.error('保存课节失败:', error)
    return false
  }
}

// 取消表单
const handleCancelForm = () => {
  formVisible.value = false
  lessonFormRef.value?.resetFields()
  teacherOptions.value = []
}

// 删除课节
const handleDeleteLesson = async (lessonId: string) => {
  try {
    await deleteLesson(lessonId)
    Message.success('删除成功')
    await loadLessons()
    emit('saveSuccess')
  } catch (error) {
    console.error('删除课节失败:', error)
  }
}

// 关闭弹窗
const handleCancel = () => {
  visible.value = false
  courseId.value = ''
  courseName.value = ''
  courseUid.value = ''
  searchKeyword.value = ''
  lessons.value = []
  courseTeachers.value = []
}

defineExpose({
  onOpen
})
</script>

<style scoped lang="scss">
.lesson-modal-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 500px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.lesson-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-2);
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--color-fill-2);
  border-bottom: 1px solid var(--color-border-2);
  font-weight: 500;
  font-size: 14px;
}

.table-body {
  flex: 1;
  overflow-y: auto;
  max-height: 450px;
}

.table-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-1);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-fill-1);
  }

  &:last-child {
    border-bottom: none;
  }
}

.table-cell {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.index-cell {
  width: 60px;
  flex-shrink: 0;
}

.name-cell {
  flex: 1;
  min-width: 150px;
  font-weight: 500;
}

.time-cell {
  width: 150px;
  flex-shrink: 0;
}

.duration-cell {
  width: 100px;
  flex-shrink: 0;
}

.seat-cell {
  width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.teacher-cell {
  width: 100px;
  flex-shrink: 0;
}

.record-cell {
  width: 80px;
  flex-shrink: 0;
  text-align: center;
}

.action-cell {
  width: 120px;
  flex-shrink: 0;
  text-align: right;
}
</style>

