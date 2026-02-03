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
              v-for="timeSlot in timeSlots"
              :key="timeSlot"
              class="time-row"
            >
              <div
                v-for="day in weekDays"
                :key="`${day.value}-${timeSlot}`"
                :class="['time-cell', getCellClass(day.value, timeSlot)]"
                @click="handleCellClick(day.value, timeSlot)"
              >
                <template v-if="getFixedCourse(day.value, timeSlot)">
                  <div class="course-info" @click.stop="onViewDetail(getFixedCourse(day.value, timeSlot)!)">
                    <div class="course-time">{{ timeSlot }}</div>
                    <div v-if="getFixedCourse(day.value, timeSlot)!.studentNames && getFixedCourse(day.value, timeSlot)!.studentNames!.length > 0" class="course-student-info">
                      <div v-for="(name, index) in getFixedCourse(day.value, timeSlot)!.studentNames" :key="index" class="student-info-item">
                        <div class="student-name">{{ name }}</div>
                        <div v-if="getFixedCourse(day.value, timeSlot)!.studentPhones && getFixedCourse(day.value, timeSlot)!.studentPhones![index]" class="student-phone">
                          {{ getFixedCourse(day.value, timeSlot)!.studentPhones![index] }}
                        </div>
                      </div>
                    </div>
                    <div class="course-actions">
                      <a-link @click.stop="onEdit(getFixedCourse(day.value, timeSlot)!)">编辑</a-link>
                      <a-link status="danger" @click.stop="onDelete(getFixedCourse(day.value, timeSlot)!)">删除</a-link>
                    </div>
                  </div>
                </template>
                <div v-else class="empty-cell">
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
  </div>
</template>

<script setup lang="ts">
import { Message } from '@arco-design/web-vue'
import FixedAddModal from './FixedAddModal.vue'
import FixedDetailDrawer from './FixedDetailDrawer.vue'
import { type FixedResp, type FixedQuery, deleteFixed, exportFixed } from '@/apis/education/fixed'
import { listTeacher } from '@/apis/education/teacher'
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

// 时间段（根据固定课自动生成）
const timeSlots = ref<string[]>([])

// 生成时间段 - 只显示有课程的时间段
const generateTimeSlots = () => {
  if (fixedCourses.value.length === 0) {
    timeSlots.value = []
    return
  }
  
  // 获取所有固定课的时间
  const courseTimes = new Set<string>()
  fixedCourses.value.forEach(course => {
    courseTimes.add(course.startTime)
  })
  
  // 转换为数组并排序
  const sortedTimes = Array.from(courseTimes).sort()
  timeSlots.value = sortedTimes
}

// 初始为空，当选择教师并加载固定课后会更新
generateTimeSlots()

// 加载教师列表
const loadTeachers = async () => {
  try {
    teacherLoading.value = true
    const res = await listTeacher({
      name: teacherSearchKeyword.value,
      page: 1,
      size: 100
    })
    console.log('Teacher API Response:', res)
    teacherList.value = res.data?.list || res.list || []
    console.log('Teacher List:', teacherList.value)
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
    // 加载完成后重新生成时间段，只显示有课程的时间
    generateTimeSlots()
  } catch (error) {
    Message.error('加载固定课失败')
    fixedCourses.value = []
    timeSlots.value = []
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

// 导出
const onExport = () => {
  const queryForm: FixedQuery = {
    teacherId: selectedTeacherId.value,
    sort: ['weekDay,asc', 'startTime,asc']
  }
  useDownload(() => exportFixed(queryForm))
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
    padding: 20px;
  }

  .week-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: var(--color-border-2);
    border: 1px solid var(--color-border-2);
    margin-bottom: 1px;

    .day-header {
      padding: 12px;
      background: var(--color-bg-1);
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
        min-height: 60px;
        background: var(--color-bg-1);
        cursor: pointer;
        transition: all 0.2s;
        position: relative;

        &.empty:hover {
          background: var(--color-fill-1);

          .empty-cell {
            opacity: 1;
          }
        }

        &.has-course {
          cursor: default;

          &.booked {
            background: #e8f5e9;  // 浅绿色 - 已预约
            
            &:hover {
              background: #c8e6c9;
            }
          }

          &.not-booked {
            background: #fff3e0;  // 浅橙色 - 未预约
            
            &:hover {
              background: #ffe0b2;
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
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .course-time {
            font-size: 14px;
            font-weight: 600;
            color: var(--color-text-1);
            margin-bottom: 0;
            line-height: 1.3;
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
            
            .student-info-item {
              margin-bottom: 4px;
              padding: 0;
              
              &:last-child {
                margin-bottom: 0;
              }
              
              .student-name {
                font-size: 13px;
                font-weight: 500;
                color: var(--color-text-1);
                line-height: 1.4;
                margin-bottom: 2px;
              }
              
              .student-phone {
                font-size: 12px;
                color: var(--color-text-3);
                line-height: 1.4;
                font-family: 'Monaco', 'Menlo', monospace;
              }
            }
          }

          .course-actions {
            display: flex;
            gap: 8px;
            opacity: 0;
            transition: opacity 0.2s;
          }
        }

        &.has-course:hover .course-actions {
          opacity: 1;
        }
      }
    }
  }
}
</style>
