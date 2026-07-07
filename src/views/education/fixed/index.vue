<template>
  <div class="fixed-page">
    <div class="fixed-header">
      <h2>固定课程管理</h2>
      <div class="header-actions">
        <a-button v-permission="['education:fixed:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </div>
    </div>

    <div class="fixed-container">
      <!-- 左侧教师列表 -->
      <div class="teacher-sidebar">
        <div class="sidebar-header">
          <a-input-search
            v-model="teacherSearchKeyword"
            placeholder="搜索教师"
            allow-clear
            @search="loadTeachers"
            @clear="loadTeachers"
          />
        </div>
        <div class="teacher-list" v-loading="teacherLoading">
          <div
            v-for="teacher in teacherList"
            :key="teacher.id"
            :class="['teacher-item', { active: selectedTeacherId === teacher.id }]"
            @click="selectTeacher(teacher)"
          >
            <a-avatar :size="40" style="margin-right: 12px">
              <img v-if="teacher.avatar" :src="teacher.avatar" />
              <icon-user v-else />
            </a-avatar>
            <div class="teacher-info">
              <div class="teacher-name">{{ teacher.name }}</div>
              <div class="teacher-meta">{{ teacher.phone || '未设置手机号' }}</div>
            </div>
          </div>
          <a-empty v-if="!teacherLoading && teacherList.length === 0" description="暂无教师" />
        </div>
      </div>

      <!-- 右侧周视图 -->
      <div class="calendar-view">
        <div class="calendar-toolbar">
          <div class="selected-teacher">
            <span v-if="selectedTeacher">老师: {{ selectedTeacher.name }}</span>
            <span v-else class="placeholder">请选择教师</span>
          </div>
          <a-button 
            v-if="selectedTeacherId" 
            type="primary" 
            @click="onAdd()"
          >
            <template #icon><icon-plus /></template>
            添加固定课
          </a-button>
        </div>

        <div v-if="selectedTeacherId" class="week-schedule" v-loading="scheduleLoading">
          <!-- 星期标题行 -->
          <div class="week-header">
            <div
              v-for="day in weekDays"
              :key="day.value"
              class="day-header"
            >
              {{ day.label }}
            </div>
          </div>

          <!-- 时间行 -->
          <div class="schedule-body">
            <div
              v-for="(row, rowIndex) in scheduleRows"
              :key="rowIndex"
              class="time-row"
            >
              <div
                v-for="day in weekDays"
                :key="`${day.value}-${rowIndex}`"
                :class="['time-cell', row[day.value] ? getCellClass(day.value, row[day.value]) : 'empty']"
                @click="row[day.value] ? handleCellClick(day.value, row[day.value]) : null"
              >
                <template v-if="row[day.value] && getFixedCourse(day.value, row[day.value])">
                  <div class="course-info">
                    <div class="course-time">{{ row[day.value] }}</div>
                    <div v-if="getFixedCourse(day.value, row[day.value])!.studentNames && getFixedCourse(day.value, row[day.value])!.studentNames!.length > 0" class="course-student-info">
                      <div v-for="(name, index) in getFixedCourse(day.value, row[day.value])!.studentNames" :key="index" class="student-info-item">
                        <div class="student-name">{{ name }}</div>
                        <div v-if="getFixedCourse(day.value, row[day.value])!.studentPhones && getFixedCourse(day.value, row[day.value])!.studentPhones![index]" class="student-phone">
                          {{ getFixedCourse(day.value, row[day.value])!.studentPhones![index] }}
                        </div>
                      </div>
                    </div>
                    <div v-else class="no-student-info">
                      无学生
                    </div>
                    <div class="course-actions">
                      <a-link
                        v-if="!getFixedCourse(day.value, row[day.value])!.bookedCount || getFixedCourse(day.value, row[day.value])!.bookedCount === 0"
                        type="primary"
                        @click.stop="onAddStudent(getFixedCourse(day.value, row[day.value])!)"
                      >
                        添加
                      </a-link>
                      <a-link @click.stop="onEdit(getFixedCourse(day.value, row[day.value])!)">编辑</a-link>
                      <a-link
                        v-if="getFixedCourse(day.value, row[day.value])!.bookedCount && getFixedCourse(day.value, row[day.value])!.bookedCount > 0"
                        status="warning"
                        @click.stop="onRemoveStudent(getFixedCourse(day.value, row[day.value])!)"
                      >
                        移除
                      </a-link>
                      <a-link
                        status="danger"
                        @click.stop="onDeleteWithBookings(getFixedCourse(day.value, row[day.value])!)"
                      >
                        删除
                      </a-link>
                    </div>
                  </div>
                </template>
                <div v-else-if="row[day.value]" class="empty-cell">
                  <icon-plus />
                </div>
              </div>
            </div>
          </div>
        </div>

        <a-empty v-else description="请从左侧选择教师查看固定课排期" style="margin-top: 100px" />
      </div>
    </div>

    <FixedAddModal ref="FixedAddModalRef" :teacher-id="selectedTeacherId" @save-success="loadFixedCourses" />
    <FixedDetailDrawer ref="FixedDetailDrawerRef" @refresh="loadFixedCourses" />

    <!-- 移除学生弹窗 -->
    <a-modal
      v-model:visible="showRemoveStudentModal"
      title="选择要移除的学生"
      @before-ok="handleConfirmRemove"
      @cancel="handleCancelRemove"
    >
      <a-form layout="vertical">
        <a-form-item label="学生列表" required>
          <a-radio-group v-model="selectedRemoveStudentId" direction="vertical">
            <a-radio
              v-for="student in removeStudentList"
              :key="student.id"
              :value="student.id"
              style="margin-bottom: 12px"
            >
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500;">{{ student.studentName }}</span>
                <span style="font-size: 12px; color: var(--color-text-3);">
                  {{ student.studentPhone || '暂无手机号' }}
                </span>
              </div>
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 添加学生弹窗 -->
    <a-modal
      v-model:visible="showAddStudentModal"
      title="添加学生"
      @before-ok="handleConfirmAddStudent"
      @cancel="handleCancelAddStudent"
      @open="onAddStudentModalOpen"
    >
      <a-form :model="addStudentForm" layout="vertical">
        <a-form-item label="选择学生" field="studentId" required>
          <a-select
            v-model="addStudentForm.studentId"
            placeholder="请选择学生"
            allow-search
            :loading="addStudentLoading"
            @search="searchStudentsForAdd"
          >
            <a-option v-for="student in addStudentList" :key="student.id" :value="student.id">
              {{ student.name }} ({{ student.phone }})
            </a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import FixedAddModal from './FixedAddModal.vue'
import FixedDetailDrawer from './FixedDetailDrawer.vue'
import { type FixedResp, type FixedQuery, deleteFixed, exportFixed, getFixedBookings, deleteFixedBooking, addFixedBooking } from '@/apis/education/fixed'
import { listTeacher } from '@/apis/education/teacher'
import { listStudent } from '@/apis/education/student'
import { useDownload } from '@/hooks'
import http from '@/utils/http'

defineOptions({ name: 'Fixed' })

onMounted(() => {
  loadTeachers()
})

// 教师列表相关
const teacherSearchKeyword = ref('')
const teacherLoading = ref(false)
const teacherList = ref<any[]>([])
const selectedTeacherId = ref<string>('')
const selectedTeacher = ref<any>(null)

// 固定课列表
const scheduleLoading = ref(false)
const fixedCourses = ref<FixedResp[]>([])

// 星期数据
const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 }
]

// 自定义行布局：每行定义各个星期几应该显示的时间
// weekDay: 1=周一, 2=周二, ..., 7=周日
const scheduleRows = ref<Array<Record<number, string>>>([])

// 生成自定义行布局
const generateScheduleRows = () => {
  if (fixedCourses.value.length === 0) {
    scheduleRows.value = []
    return
  }

  // 获取每个星期几的所有时间并排序
  const timesByDay = new Map<number, string[]>()
  fixedCourses.value.forEach(course => {
    if (!timesByDay.has(course.weekDay)) {
      timesByDay.set(course.weekDay, [])
    }
    if (!timesByDay.get(course.weekDay)!.includes(course.startTime)) {
      timesByDay.get(course.weekDay)!.push(course.startTime)
    }
  })

  // 对每个星期几的时间进行排序
  timesByDay.forEach((times, day) => {
    times.sort()
  })

  // 找出最大行数
  let maxRows = 0
  timesByDay.forEach(times => {
    maxRows = Math.max(maxRows, times.length)
  })

  // 生成行布局
  const rows: Array<Record<number, string>> = []
  for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
    const row: Record<number, string> = {}
    weekDays.forEach(day => {
      const dayTimes = timesByDay.get(day.value) || []
      if (rowIndex < dayTimes.length) {
        row[day.value] = dayTimes[rowIndex]
      }
    })
    rows.push(row)
  }

  scheduleRows.value = rows
}

// 加载教师列表
const loadTeachers = async () => {
  try {
    teacherLoading.value = true
    const res = await listTeacher({
      name: teacherSearchKeyword.value,
      isShow: 1,
      isFixed: 1,
      page: 1,
      size: 100
    })
    console.log('Teacher API Response:', res)
    teacherList.value = res.data?.list || res.list || []
    console.log('Teacher List:', teacherList.value)
    if (!selectedTeacherId.value && teacherList.value.length > 0) {
      selectTeacher(teacherList.value[0])
    }
  } catch (error) {
    console.error('Load teachers error:', error)
    Message.error('加载教师列表失败')
  } finally {
    teacherLoading.value = false
  }
}

// 选择教师
const selectTeacher = (teacher: any) => {
  selectedTeacherId.value = teacher.id
  selectedTeacher.value = teacher
  loadFixedCourses()
}

// 加载固定课列表
const loadFixedCourses = async () => {
  if (!selectedTeacherId.value) return
  
  try {
    scheduleLoading.value = true
    const res = await http.get(`/education/fixed/teacher/${selectedTeacherId.value}`)
    fixedCourses.value = res.data || []
    // 加载完成后重新生成行布局
    generateScheduleRows()
  } catch (error) {
    Message.error('加载固定课失败')
    fixedCourses.value = []
    scheduleRows.value = []
  } finally {
    scheduleLoading.value = false
  }
}

// 获取指定星期和时间的固定课
const getFixedCourse = (weekDay: number, timeSlot: string) => {
  return fixedCourses.value.find(
    course => course.weekDay === weekDay && course.startTime === timeSlot
  )
}

// 获取单元格样式类
const getCellClass = (weekDay: number, timeSlot: string) => {
  const course = getFixedCourse(weekDay, timeSlot)
  if (course) {
    // 判断是否有学生预约
    const hasBooking = course.bookedCount > 0 || (course.studentNames && course.studentNames.length > 0)
    return hasBooking ? 'has-course booked' : 'has-course not-booked'
  }
  return 'empty'
}

// 点击单元格
const handleCellClick = (weekDay: number, timeSlot: string) => {
  const course = getFixedCourse(weekDay, timeSlot)
  if (!course) {
    // 点击空单元格，新增固定课
    onAdd(weekDay, timeSlot)
  }
}

const FixedAddModalRef = ref<InstanceType<typeof FixedAddModal>>()
const FixedDetailDrawerRef = ref<InstanceType<typeof FixedDetailDrawer>>()

// 新增固定课
const onAdd = (weekDay?: number, startTime?: string) => {
  if (!selectedTeacherId.value) {
    Message.warning('请先选择教师')
    return
  }
  FixedAddModalRef.value?.onAdd(weekDay, startTime)
}

// 编辑固定课
const onEdit = (record: FixedResp) => {
  FixedAddModalRef.value?.onUpdate(record.id)
}

// 查看详情
const onViewDetail = (record: FixedResp) => {
  FixedDetailDrawerRef.value?.onOpen(record.id)
}

// 删除固定课
const onDelete = async (record: FixedResp) => {
  // 检查是否有学生预约
  const hasBooking = record.bookedCount > 0 || (record.studentNames && record.studentNames.length > 0)
  if (hasBooking) {
    Message.warning('该固定课已有学生预约，无法删除')
    return
  }

  try {
    await deleteFixed([record.id])
    Message.success('删除成功')
    loadFixedCourses()
  } catch (error) {
    Message.error('删除失败')
  }
}

// 删除固定课（包含预约）
const onDeleteWithBookings = async (record: FixedResp) => {
  const hasBooking = record.bookedCount > 0 || (record.studentNames && record.studentNames.length > 0)

  const { Modal } = await import('@arco-design/web-vue')

  const confirmContent = hasBooking
    ? `该固定课已有 ${record.bookedCount} 个学生预约，删除后将同时取消所有学生的预约。确定要删除吗？`
    : '确定要删除该固定课吗？'

  Modal.confirm({
    title: '确认删除',
    content: confirmContent,
    onOk: async () => {
      try {
        // 如果有预约，先取消所有预约
        if (hasBooking) {
          const res = await getFixedBookings(record.id)
          const students = res.data || res || []

          // 逐个取消预约
          for (const student of students) {
            await deleteFixedBooking(student.id)
          }
        }

        // 删除固定课
        await deleteFixed([record.id])
        Message.success('删除成功')
        loadFixedCourses()
      } catch (error) {
        Message.error('删除失败')
      }
    }
  })
}

// 导出
const onExport = () => {
  const queryForm: FixedQuery = {
    teacherId: selectedTeacherId.value,
    sort: ['weekDay,asc', 'startTime,asc']
  }
  useDownload(() => exportFixed(queryForm))
}

// 移除学生预约
const onRemoveStudent = async (record: FixedResp) => {
  try {
    // 获取该固定课的预约学生列表
    const res = await getFixedBookings(record.id)
    const students = res.data || res || []

    if (students.length === 0) {
      Message.warning('该固定课暂无学生预约')
      return
    }

    if (students.length === 1) {
      // 只有一个学生，直接确认后取消
      const student = students[0]
      const { Modal } = await import('@arco-design/web-vue')
      Modal.confirm({
        title: '确认取消预约',
        content: `确定要取消 ${student.studentName} 的固定课预约吗？`,
        onOk: async () => {
          try {
            await deleteFixedBooking(student.id)
            Message.success('取消预约成功')
            loadFixedCourses()
          } catch (error) {
            Message.error('取消预约失败')
          }
        }
      })
    } else {
      // 多个学生，显示选择框
      showRemoveStudentModal.value = true
      removeStudentList.value = students
      currentRemovingFixedId.value = record.id
    }
  } catch (error) {
    Message.error('加载学生列表失败')
  }
}

// 移除学生相关状态
const showRemoveStudentModal = ref(false)
const removeStudentList = ref<any[]>([])
const currentRemovingFixedId = ref('')
const selectedRemoveStudentId = ref('')

// 添加学生相关状态
const showAddStudentModal = ref(false)
const addStudentForm = reactive({
  studentId: ''
})
const addStudentList = ref<any[]>([])
const addStudentLoading = ref(false)
const currentAddingFixed = ref<FixedResp | null>(null)
const lastSelectedStudentIdForAdd = ref('')

// 确认移除学生
const handleConfirmRemove = async () => {
  if (!selectedRemoveStudentId.value) {
    Message.warning('请选择要移除的学生')
    return false
  }

  const student = removeStudentList.value.find(s => s.id === selectedRemoveStudentId.value)
  if (!student) {
    Message.error('学生信息无效')
    return false
  }

  try {
    await deleteFixedBooking(selectedRemoveStudentId.value)
    Message.success('取消预约成功')
    showRemoveStudentModal.value = false
    selectedRemoveStudentId.value = ''
    removeStudentList.value = []
    currentRemovingFixedId.value = ''
    loadFixedCourses()
    return true
  } catch (error) {
    Message.error('取消预约失败')
    return false
  }
}

// 取消移除学生弹窗
const handleCancelRemove = () => {
  showRemoveStudentModal.value = false
  selectedRemoveStudentId.value = ''
  removeStudentList.value = []
  currentRemovingFixedId.value = ''
}

// 添加学生到固定课
const onAddStudent = (record: FixedResp) => {
  currentAddingFixed.value = record
  showAddStudentModal.value = true
}

// 打开添加学生模态框时
const onAddStudentModalOpen = async () => {
  await searchStudentsForAdd()
  // 如果有上次选择的学生，自动填入
  if (lastSelectedStudentIdForAdd.value) {
    addStudentForm.studentId = lastSelectedStudentIdForAdd.value
  }
}

// 搜索学生（用于添加）
const searchStudentsForAdd = async (name?: string) => {
  try {
    addStudentLoading.value = true
    const res = await listStudent({
      name,
      page: 1,
      size: 50
    })
    // 处理不同的响应结构
    if (res.data && res.data.list) {
      addStudentList.value = res.data.list
    } else if (res.list) {
      addStudentList.value = res.list
    } else if (Array.isArray(res)) {
      addStudentList.value = res
    } else {
      addStudentList.value = []
    }
  } catch (error) {
    console.error('搜索学生失败:', error)
    addStudentList.value = []
  } finally {
    addStudentLoading.value = false
  }
}

// 确认添加学生
const handleConfirmAddStudent = async () => {
  if (!addStudentForm.studentId) {
    Message.warning('请选择学生')
    return false
  }

  if (!currentAddingFixed.value) {
    Message.error('固定课信息无效')
    return false
  }

  try {
    await addFixedBooking({
      fixedId: currentAddingFixed.value.id,
      studentId: addStudentForm.studentId
    })
    // 保存当前选择的学生ID，下次默认使用
    lastSelectedStudentIdForAdd.value = addStudentForm.studentId
    Message.success('添加成功')
    showAddStudentModal.value = false
    handleCancelAddStudent()
    loadFixedCourses()
    return true
  } catch (error) {
    Message.error('添加失败')
    return false
  }
}

// 取消添加学生
const handleCancelAddStudent = () => {
  addStudentForm.studentId = ''
  addStudentList.value = []
  currentAddingFixed.value = null
}

</script>

<style scoped lang="scss">
.fixed-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-2);
}

.fixed-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--color-bg-1);
  border-bottom: 1px solid var(--color-border-2);

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-1);
  }
}

.fixed-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.teacher-sidebar {
  width: 200px;
  background: var(--color-bg-1);
  border-right: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid var(--color-border-2);
  }

  .teacher-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .teacher-item {
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--color-fill-1);

    &:hover {
      background: var(--color-fill-2);
    }

    &.active {
      background: var(--color-primary-light-1);
      border: 1px solid var(--color-primary-6);
    }

    .teacher-info {
      flex: 1;
      min-width: 0;

      .teacher-name {
        font-weight: 500;
        font-size: 14px;
        color: var(--color-text-1);
        margin-bottom: 4px;
      }

      .teacher-meta {
        font-size: 12px;
        color: var(--color-text-3);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.calendar-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .calendar-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border-2);
    background: var(--color-bg-1);

    .selected-teacher {
      font-size: 16px;
      font-weight: 500;
      color: var(--color-text-1);

      .placeholder {
        color: var(--color-text-3);
      }
    }
  }

  .week-schedule {
    flex: 1;
    overflow: auto;
    padding: 0 20px 20px 20px;
  }

  .week-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: var(--color-border-2);
    border: 1px solid var(--color-border-2);
    margin-bottom: 1px;
    position: sticky;
    top: 0;
    z-index: 10;

    .day-header {
      padding: 12px;
      background: var(--color-fill-2);
      text-align: center;
      font-weight: 600;
      font-size: 14px;
      color: var(--color-text-1);
    }
  }

  .schedule-body {
    .time-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1px;
      background: var(--color-border-2);
      border-left: 1px solid var(--color-border-2);
      border-right: 1px solid var(--color-border-2);
      border-bottom: 1px solid var(--color-border-2);

      .time-cell {
        min-height: 65px;
        background: var(--color-bg-1);
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
        border-bottom: 1px solid var(--color-border-2);
        display: flex;
        align-items: center;
        justify-content: center;

        &.empty {
          min-height: 40px;
        }

        &.empty:hover {
          background: var(--color-fill-1);

          .empty-cell {
            opacity: 1;
          }
        }

        &.has-course {
          cursor: default;

          &.booked {
            background: #d8d8d8;  // 更深的灰色 - 已预约
            border-bottom: 1px solid #ffffff;  // 白色分隔线

            &:hover {
              background: #c0c0c0;
            }
          }

          &.not-booked {
            background: #ffffff;  // 白色 - 未预约
            border-bottom: 1px solid #f0f0f0;  // 更浅的灰色分隔线

            &:hover {
              background: #fafafa;
            }
          }
        }

        .empty-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          opacity: 0;
          transition: opacity 0.2s;
          color: var(--color-text-3);
          font-size: 20px;
        }

        .course-info {
          padding: 6px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
          box-sizing: border-box;

          .course-time {
            font-size: 16px;
            font-weight: 700;
            color: var(--color-text-1);
            margin-bottom: 2px;
            line-height: 1.2;
            text-align: center;
          }

          .course-student-names {
            font-size: 13px;
            color: var(--color-text-2);
            margin-bottom: 6px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.3;

            span {
              cursor: help;
            }
          }

          .course-student-info {
            flex: 1;
            text-align: center;

            .student-info-item {
              margin-bottom: 3px;
              padding: 0;

              &:last-child {
                margin-bottom: 0;
              }

              .student-name {
                font-size: 12px;
                font-weight: 500;
                color: var(--color-text-1);
                line-height: 1.3;
                margin-bottom: 1px;
              }

              .student-phone {
                font-size: 11px;
                color: var(--color-text-3);
                line-height: 1.3;
                font-family: 'Monaco', 'Menlo', monospace;
              }
            }
          }

          .no-student-info {
            flex: 1;
            text-align: center;
            font-size: 12px;
            color: var(--color-text-3);
            line-height: 1.3;
            padding: 2px 0;
          }

          .course-actions {
            display: flex;
            gap: 2px;
            justify-content: center;
            margin-top: 2px;
            font-size: 12px;
          }
        }
      }
    }
  }
}
</style>
