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
        <div class="toolbar-left">
          <a-input-search
            v-model="searchKeyword"
            placeholder="搜索课节名称"
            allow-clear
            style="width: 280px"
            @search="loadLessons"
            @clear="loadLessons"
          />
          <a-button 
            v-if="selectedLessonIds.length > 0" 
            type="outline" 
            status="danger"
            @click="handleBatchDelete"
          >
            <template #icon><icon-delete /></template>
            批量删除 ({{ selectedLessonIds.length }})
          </a-button>
        </div>
        <a-space>
          <a-button type="primary" @click="onAddLesson">
            <template #icon><icon-plus /></template>
            新增课节
          </a-button>
          <a-button type="primary" status="success" @click="onBatchAddLesson">
            <template #icon><icon-plus /></template>
            批量新建课节
          </a-button>
        </a-space>
      </div>

      <!-- 课节列表 -->
      <a-spin :loading="loading" style="width: 100%">
        <div class="lesson-table">
          <div class="table-header">
            <div class="table-cell checkbox-cell">
              <a-checkbox 
                v-model="selectAll"
                :indeterminate="isIndeterminate"
                @change="handleSelectAll"
              />
            </div>
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
              <div class="table-cell checkbox-cell">
                <a-checkbox 
                  :model-value="selectedLessonIds.includes(lesson.id)"
                  @change="(checked: boolean) => handleSelectLesson(lesson.id, checked)"
                />
              </div>
              <div class="table-cell index-cell">{{ index + 1 }}</div>
              <div class="table-cell name-cell" :title="lesson.name">{{ lesson.name }}</div>
              <div class="table-cell time-cell">{{ formatDateTime(lesson.startTime) }}</div>
              <div class="table-cell duration-cell">{{ formatDuration(lesson.duration) }}</div>
              <div class="table-cell seat-cell">1对{{ typeof lesson.seatNum === 'string' ? parseInt(lesson.seatNum) : lesson.seatNum }}</div>
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
      :title="isEdit ? '编辑课节' : (isBatchMode ? '批量新建课节' : '新增课节')"
      width="600px"
      :mask-closable="false"
      @before-ok="handleSaveLesson"
      @cancel="handleCancelForm"
    >
      <a-form :model="lessonForm" ref="lessonFormRef" layout="vertical">
        <a-form-item
          v-if="!isBatchMode"
          label="课节名称"
          field="name"
          :rules="[{ required: true, message: '请输入课节名称' }]"
        >
          <a-input v-model="lessonForm.name" placeholder="请输入课节名称" :max-length="50" show-word-limit />
        </a-form-item>
        
        <a-form-item
          v-if="isBatchMode"
          label="课堂名称"
          field="name"
          :rules="[{ required: true, message: '请输入课堂名称' }]"
        >
          <a-space style="width: 100%;">
            <a-input 
              v-model="lessonForm.name" 
              placeholder="请输入课堂名称" 
              :max-length="50" 
              show-word-limit 
              style="flex: 1; width: 400px;"
            />
            <span>-</span>
            <a-input-number 
              v-model="lessonForm.startNumber" 
              placeholder="起始编号" 
              :min="1" 
              style="width: 150px;"
            />
          </a-space>
        </a-form-item>
        
        <a-form-item
          v-if="isBatchMode"
          label="课堂数量"
          field="lessonCount"
          :rules="[{ required: true, message: '请输入课堂数量' }]"
        >
          <a-input-number 
            v-model="lessonForm.lessonCount" 
            placeholder="请输入课堂数量" 
            :min="1" 
            :max="50"
            style="width: 100%"
          />
        </a-form-item>
        
        <a-form-item
          v-if="isBatchMode"
          label="每周规律"
          field="weeklySchedule"
          :rules="[{ required: true, message: '请选择每周规律' }]"
        >
          <a-space wrap>
            <a-button
              v-for="(day, index) in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']"
              :key="index"
              :type="lessonForm.weeklySchedule.includes(index + 1) ? 'primary' : 'outline'"
              @click="toggleWeekDay(index + 1)"
            >
              {{ day }}
            </a-button>
          </a-space>
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
                return Array.from({ length: 60 }, (_, i) => i).filter(i => ![0, 10, 15, 20, 25, 30, 40, 45, 50].includes(i))
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
              <a-option :value="15">15</a-option>
              <a-option :value="20">20</a-option>
              <a-option :value="25">25</a-option>
              <a-option :value="30">30</a-option>
              <a-option :value="40">40</a-option>
              <a-option :value="45">45</a-option>
              <a-option :value="50">50</a-option>
            </a-select>
            <span>分钟</span>
          </div>
        </a-form-item>
        
        <a-form-item
          label="教学形式（1对几）"
          field="seatNum"
          :rules="[{ required: true, message: '请选择教学形式' }]"
        >
          <a-select v-model="lessonForm.seatNum" placeholder="请选择1对几">
            <a-option v-for="n in 12" :key="n" :value="n">1对{{ n }}</a-option>
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
import { IconPlus, IconDelete } from '@arco-design/web-vue/es/icon'
import {
  listCourseLessons,
  addLesson,
  updateLesson,
  deleteLesson,
  type LessonResp
} from '@/apis/education/lesson'
import { searchTeachers, type TeacherResp } from '@/apis/education/teacher'
import { getCourse, listCourseTeachers, type CourseTeacherResp } from '@/apis/education/course'

const visible = ref(false)
const loading = ref(false)
const formVisible = ref(false)
const teacherLoading = ref(false)
const courseId = ref('')
const courseName = ref('')
const courseUid = ref('')
const searchKeyword = ref('')
const isEdit = ref(false)
const isBatchMode = ref(false) // 是否为批量创建模式
const editingLessonId = ref('')

const lessons = ref<LessonResp[]>([])
const lessonFormRef = ref()

// 教师搜索
const teacherOptions = ref<{ label: string; value: string; id: number | string }[]>([])

// 选中状态
const selectedLessonIds = ref<string[]>([])
const selectAll = ref(false)

// 半选状态
const isIndeterminate = computed(() => {
  const selectedCount = selectedLessonIds.value.length
  const totalCount = filteredLessons.value.length
  return selectedCount > 0 && selectedCount < totalCount
})

const emit = defineEmits<{
  saveSuccess: []
}>()

// 课节表单
const lessonForm = ref({
  name: '',
  startTime: '',
  durationHours: 0,
  durationMinutes: 25,
  seatNum: 1, // 默认1对1，值为1
  teacherId: '',
  teacherName: '', // 用于显示教师名字
  recordState: 0,
  lessonCount: 1, // 课堂数量（批量创建用）
  weeklySchedule: [] as number[], // 每周规律：0-6表示周日到周六
  startNumber: 1 // 批量创建时的起始编号
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

// 每周规律描述（computed 优化性能）
const weeklyScheduleDescription = computed(() => {
  if (!lessonForm.value.startTime || lessonForm.value.weeklySchedule.length === 0) {
    return { line1: '', line2: '' }
  }
  
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const startDate = new Date(lessonForm.value.startTime)
  const startDayOfWeek = startDate.getDay() // 0-6，0是周日
  
  // 计算第一节课的日期描述
  const firstLessonDayIndex = lessonForm.value.weeklySchedule[0]
  const firstLessonDay = weekDays[firstLessonDayIndex === 7 ? 0 : firstLessonDayIndex]
  
  // 格式化开始日期
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // 计算第一节课的实际日期
  let daysDiff = firstLessonDayIndex - (startDayOfWeek === 0 ? 7 : startDayOfWeek)
  if (daysDiff < 0) daysDiff += 7
  
  const firstLessonDate = new Date(startDate)
  firstLessonDate.setDate(firstLessonDate.getDate() + daysDiff)
  
  // 生成描述（分两行）
  const selectedDays = lessonForm.value.weeklySchedule.map(d => weekDays[d === 7 ? 0 : d]).join('、')
  return {
    line1: `从${formatDate(firstLessonDate)} ${firstLessonDay}开始，`,
    line2: `每周的${selectedDays}有课堂`
  }
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

// 切换选择的星期几
const toggleWeekDay = (day: number) => {
  const index = lessonForm.value.weeklySchedule.indexOf(day)
  if (index > -1) {
    lessonForm.value.weeklySchedule.splice(index, 1)
  } else {
    lessonForm.value.weeklySchedule.push(day)
  }
  // 排序，保持从周一到周日的顺序
  lessonForm.value.weeklySchedule.sort((a, b) => a - b)
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

// 新增单个课节
const onAddLesson = async () => {
  isEdit.value = false
  isBatchMode.value = false // 单个创建模式
  editingLessonId.value = ''
  
  // 计算默认上课时间：下一个小时的整点
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setHours(now.getHours() + 1)
  nextHour.setMinutes(0)
  nextHour.setSeconds(0)
  nextHour.setMilliseconds(0)
  
  // 格式化为 YYYY-MM-DD HH:mm:ss
  const formatDefaultTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
  
  lessonForm.value = {
    name: courseName.value, // 默认填充班级名称
    startTime: formatDefaultTime(nextHour),
    durationHours: 0,
    durationMinutes: 25,
    seatNum: 1,
    teacherId: '',
    teacherName: '',
    recordState: 0,
    lessonCount: 1, // 默认1节课
    weeklySchedule: [], // 清空每周规律
    startNumber: 1 // 单个创建时不使用，设置默认值
  }
  teacherOptions.value = []
  
  // 获取课程关联的老师列表，并默认选中第一个老师
  try {
    const response = await listCourseTeachers(courseId.value)
    const courseTeachers = response.data || []
    if (courseTeachers.length > 0) {
      const firstTeacher = courseTeachers[0]
      lessonForm.value.teacherId = firstTeacher.teacherId
      lessonForm.value.teacherName = firstTeacher.teacherName
      // 设置老师选项，以便在autocomplete中显示
      teacherOptions.value = [{
        label: firstTeacher.teacherName,
        value: firstTeacher.teacherId,
        id: firstTeacher.teacherId
      }]
    }
  } catch (error) {
    console.error('获取课程老师列表失败:', error)
  }
  
  formVisible.value = true
}

// 批量新建课节
const onBatchAddLesson = async () => {
  isEdit.value = false
  isBatchMode.value = true // 批量创建模式
  editingLessonId.value = ''
  
  // 计算默认上课时间：下一个小时的整点
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setHours(now.getHours() + 1)
  nextHour.setMinutes(0)
  nextHour.setSeconds(0)
  nextHour.setMilliseconds(0)
  
  // 格式化为 YYYY-MM-DD HH:mm:ss
  const formatDefaultTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
  
  // 计算起始编号：获取最大编号 + 1
  let maxNumber = 0
  try {
    const lessonList = lessons.value
    if (lessonList && lessonList.length > 0) {
      // 从课节名称中提取编号
      lessonList.forEach(lesson => {
        const match = lesson.name.match(/-\s*(\d+)$/)
        if (match) {
          const num = parseInt(match[1])
          if (num > maxNumber) {
            maxNumber = num
          }
        }
      })
    }
  } catch (error) {
    console.error('计算起始编号失败:', error)
  }
  
  lessonForm.value = {
    name: courseName.value, // 默认填充班级名称
    startTime: formatDefaultTime(nextHour),
    durationHours: 0,
    durationMinutes: 25,
    seatNum: 1,
    teacherId: '',
    teacherName: '',
    recordState: 0,
    lessonCount: 10, // 批量创建默认10节课
    weeklySchedule: [], // 清空每周规律
    startNumber: maxNumber + 1 // 起始编号为最大编号+1
  }
  teacherOptions.value = []
  
  // 获取课程关联的老师列表，并默认选中第一个老师
  try {
    const response = await listCourseTeachers(courseId.value)
    const courseTeachers = response.data || []
    if (courseTeachers.length > 0) {
      const firstTeacher = courseTeachers[0]
      lessonForm.value.teacherId = firstTeacher.teacherId
      lessonForm.value.teacherName = firstTeacher.teacherName
      // 设置老师选项，以便在autocomplete中显示
      teacherOptions.value = [{
        label: firstTeacher.teacherName,
        value: firstTeacher.teacherId,
        id: firstTeacher.teacherId
      }]
    }
  } catch (error) {
    console.error('获取课程老师列表失败:', error)
  }
  
  formVisible.value = true
}

// 编辑课节
const onEditLesson = (lesson: LessonResp) => {
  isEdit.value = true
  isBatchMode.value = false // 编辑时不是批量模式
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
    seatNum: typeof lesson.seatNum === 'string' ? parseInt(lesson.seatNum) : (lesson.seatNum || 1),
    teacherId: lesson.teacherId || '',
    teacherName: lesson.teacherName || '', // 填充教师名字
    recordState: typeof lesson.recordState === 'string' ? parseInt(lesson.recordState) : (lesson.recordState || 0),
    lessonCount: 1, // 编辑时不支持批量
    weeklySchedule: [], // 编辑时不使用
    startNumber: 1 // 编辑时不使用，设置默认值
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
    // 表单验证
    await lessonFormRef.value?.validate()
    
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
    
    // 如果是批量创建，验证每周规律
    if (isBatchMode.value && lessonForm.value.weeklySchedule.length === 0) {
      Message.error('批量创建时请选择每周规律')
      return false
    }
    
    // 准备提交数据
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hours}:${minutes}:00`
    }
    
    if (isEdit.value) {
      // 编辑单个课节
      const startTime = new Date(lessonForm.value.startTime)
      startTime.setSeconds(0)
      
      const submitData = {
        courseId: courseId.value,
        courseUid: courseUid.value,
        name: lessonForm.value.name,
        teacherId: lessonForm.value.teacherId,
        startTime: formatDate(startTime),
        duration: totalMinutes,
        seatNum: lessonForm.value.seatNum,
        recordState: lessonForm.value.recordState,
        liveState: 0,
        openState: 0
      }
      
      await updateLesson(submitData, editingLessonId.value)
      Message.success('修改成功')
    } else {
      // 新增课节（单个或批量）
      if (!isBatchMode.value) {
        // 单个创建
        const startTime = new Date(lessonForm.value.startTime)
        startTime.setSeconds(0)
        
        const submitData = {
          courseId: courseId.value,
          courseUid: courseUid.value,
          name: lessonForm.value.name,
          teacherId: lessonForm.value.teacherId,
          startTime: formatDate(startTime),
          duration: totalMinutes,
          seatNum: lessonForm.value.seatNum,
          recordState: lessonForm.value.recordState,
          liveState: 0,
          openState: 0
        }
        
        await addLesson(submitData)
        Message.success('新增成功')
      } else {
        // 批量创建
        const startDate = new Date(lessonForm.value.startTime)
        const weeklySchedule = lessonForm.value.weeklySchedule
        
        // 计算每节课的上课时间
        const lessonDates: Date[] = []
        let currentDate = new Date(startDate)
        let createdCount = 0
        
        // 生成课节日期列表
        while (createdCount < lessonForm.value.lessonCount) {
          const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay() // 转换为1-7，7是周日
          
          if (weeklySchedule.includes(dayOfWeek)) {
            lessonDates.push(new Date(currentDate))
            createdCount++
          }
          
          // 移到下一天
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        // 批量创建课节
        const promises = lessonDates.map((date, index) => {
          const submitData = {
            courseId: courseId.value,
            courseUid: courseUid.value,
            name: `${lessonForm.value.name} - ${lessonForm.value.startNumber + index}`,
            teacherId: lessonForm.value.teacherId,
            startTime: formatDate(date),
            duration: totalMinutes,
            seatNum: lessonForm.value.seatNum,
            recordState: lessonForm.value.recordState,
            liveState: 0,
            openState: 0
          }
          
          return addLesson(submitData)
        })
        
        await Promise.all(promises)
        Message.success(`成功创建 ${lessonForm.value.lessonCount} 节课程`)
      }
    }
    
    formVisible.value = false
    await loadLessons()
    emit('saveSuccess')
    return true
  } catch (error: any) {
    console.error('保存课节失败:', error)
    // 如果是表单验证错误，不显示错误消息（已经有字段提示）
    if (error?.message && !error?.name?.includes('Validate')) {
      Message.error(error.message || '保存失败')
    }
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
    // 清空选中状态
    selectedLessonIds.value = []
    selectAll.value = false
    emit('saveSuccess')
  } catch (error) {
    console.error('删除课节失败:', error)
  }
}

// 全选/取消全选
const handleSelectAll = (checked: boolean) => {
  if (checked) {
    selectedLessonIds.value = filteredLessons.value.map(lesson => lesson.id)
  } else {
    selectedLessonIds.value = []
  }
  selectAll.value = checked
}

// 单个选择
const handleSelectLesson = (lessonId: string, checked: boolean) => {
  if (checked) {
    if (!selectedLessonIds.value.includes(lessonId)) {
      selectedLessonIds.value.push(lessonId)
    }
  } else {
    const index = selectedLessonIds.value.indexOf(lessonId)
    if (index > -1) {
      selectedLessonIds.value.splice(index, 1)
    }
  }
  
  // 更新全选状态
  selectAll.value = selectedLessonIds.value.length === filteredLessons.value.length && filteredLessons.value.length > 0
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedLessonIds.value.length === 0) {
    Message.warning('请至少选择一个课节')
    return
  }
  
  // 使用Arco Design的Modal确认对话框
  const { Modal } = await import('@arco-design/web-vue')
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除选中的 ${selectedLessonIds.value.length} 个课节吗？此操作将同步删除ClassIn中的对应课节，且不可恢复！`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        // 调用批量删除接口，直接传递数组
        await deleteLesson(selectedLessonIds.value)
        Message.success(`成功删除 ${selectedLessonIds.value.length} 个课节`)
        await loadLessons()
        // 清空选中状态
        selectedLessonIds.value = []
        selectAll.value = false
        emit('saveSuccess')
      } catch (error) {
        console.error('批量删除课节失败:', error)
        Message.error('批量删除失败')
      }
    }
  })
}

// 关闭弹窗
const handleCancel = () => {
  visible.value = false
  // 清空选中状态
  selectedLessonIds.value = []
  selectAll.value = false
  courseId.value = ''
  courseName.value = ''
  courseUid.value = ''
  searchKeyword.value = ''
  lessons.value = []
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

.toolbar-left {
  display: flex;
  gap: 12px;
  align-items: center;
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

.checkbox-cell {
  width: 50px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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

