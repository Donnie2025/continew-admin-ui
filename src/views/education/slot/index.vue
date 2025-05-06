<template>
  <div class="schedule-container">
    <div class="top-bar">
      <div class="top-bar-inner">
        <div class="teacher-info">
          老师：<span class="teacher-name">{{ currentTeacherName }}</span>
        </div>
        <div class="action-buttons">
          <a-button-group>
            <a-button type="primary" @click="handleAddSlot">增加课时</a-button>
            <a-button>复制课表</a-button>
            <a-button>批量删除</a-button>
            <a-button>导出</a-button>
          </a-button-group>
        </div>
      </div>
    </div>
    <div class="main-content">
      <div class="teacher-list">
        <div class="search-box">
          <a-input-search v-model="teacherSearch" placeholder="搜索老师" allow-clear />
        </div>
        <div class="teacher-items">
          <a-list :bordered="false">
            <a-list-item v-for="teacher in filteredTeachers" :key="teacher.id" class="teacher-item"
              :class="{ active: selectedTeacherId === teacher.id }"
              @click="handleSelectTeacher(teacher.id)">
              <div class="teacher-avatar">
                <a-avatar :size="36">
                  <img v-if="teacher.avatar" :src="teacher.avatar" />
                  <template v-else>{{ teacher.name?.[0]?.toUpperCase() }}</template>
                </a-avatar>
              </div>
              <div class="teacher-info">
                <div class="teacher-name">{{ teacher.name }}</div>
              </div>
            </a-list-item>
          </a-list>
        </div>
      </div>
      <div class="schedule-content">
        <div class="schedule-header">
          <div class="nav-actions">
            <a-space>
              <a-button-group>
                <a-button @click="handlePrevWeek">
                  <template #icon><icon-left /></template>
                </a-button>
                <a-button @click="handleNextWeek">
                  <template #icon><icon-right /></template>
                </a-button>
              </a-button-group>
              <a-button @click="handleToday">今天</a-button>
            </a-space>
            <div class="date-range">{{ dateRangeStr }}</div>
          </div>
        </div>
        <div class="schedule-grid">
          <div class="week-header">
            <div v-for="day in weekDays" :key="day.date" class="day-column">
              <div class="day-label">{{ day.label }}</div>
              <div class="date-label">{{ day.date }}</div>
            </div>
          </div>
          <div class="time-grid">
            <div v-for="timeSlot in timeSlots" :key="timeSlot" class="time-row">
              <div v-for="(day, dayIndex) in 7" :key="day" class="time-cell">
                <div
                  class="slot-card"
                  :class="getSlotInfo(timeSlot, dayIndex).status"
                  @click="getSlotInfo(timeSlot, dayIndex).status === 'empty' ? handleCellClick(timeSlot, dayIndex) : handleCourseClick(timeSlot, dayIndex)"
                >
                  <span class="status-bar" :class="getSlotInfo(timeSlot, dayIndex).status"></span>
                  <span class="slot-content">
                    <span class="slot-time">{{ timeSlot }}</span>
                    <span v-if="getSlotInfo(timeSlot, dayIndex).studentName" class="slot-student">{{ getSlotInfo(timeSlot, dayIndex).studentName }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 课程详情弹窗 -->
  <a-modal
    v-model:visible="courseDetailVisible"
    title="1对1预约详情"
    :footer="false"
    :mask-closable="false"
    :width="700"
  >
    <div class="detail-header">
      <div class="detail-title">
        <div class="date-time">2025-05-05 19:00</div>
        <div class="teacher">授课老师：Nest</div>
      </div>
      <div class="detail-actions">
        <a-button type="primary">添加会员预约</a-button>
        <a-button style="margin-left: 8px;" status="danger">删除</a-button>
      </div>
    </div>
    <div class="detail-classroom">
      <div class="classroom-info">
        <div>在线教室</div>
        <div>上课工具：<span class="bold">ClassIn客户端</span></div>
        <div>会员上课时长：<span class="red">暂未上传</span></div>
        <div>会员进入教室：-</div>
        <div>会员离开教室：-</div>
        <div>老师上课时长：<span class="red">暂未上传</span></div>
        <div>老师进入教室：-</div>
        <div>老师离开教室：-</div>
        <div>教室网址：<a href="https://www.eeo.cn/client/invoke/index.html" target="_blank">https://www.eeo.cn/client/invoke/index.html</a></div>
      </div>
      <div class="classroom-action">
        <a-button>取消在线教室</a-button>
      </div>
    </div>
    <a-tabs default-active-key="2" class="detail-tabs">
      <a-tab-pane key="2" title="已确认预约">
        <div class="detail-table-custom">
          <div class="table-row">
            <div class="table-cell info">
              <div class="cell-title">预约信息</div>
              <div class="cell-content">
                会员：YoYo8<br />
                手机号：13269886955<br />
                使用会员卡：线上月卡（20节）<br />
                预约备注：<br />
                是否允许会员取消：是<br />
                操作人：管理员<br />
                操作时间：2025-04-25 22:00:43
              </div>
            </div>
            <div class="table-cell material">
              <div class="cell-title">教材</div>
              <div class="cell-content">
                【B01】Kid's Box 剑桥国际少儿英语 1<br />
                -Unit1<br />
                -006 KB1 Unit3-1.ppt<br />
                <br />
                预览地址：<a href="https://sxqpz2thup5.feishu.cn/file/leePbMnvJo7qKpxeCmocuvHbnsb" target="_blank">https://sxqpz2thup5.feishu.cn/file/leePbMnvJo7qKpxeCmocuvHbnsb</a>
              </div>
            </div>
            <div class="table-cell action">
              <div class="cell-title">操作</div>
              <div class="cell-content">
                <a class="table-link">修改</a>
                <a class="table-link" style="margin-left: 16px;">取消预约</a>
              </div>
            </div>
          </div>
        </div>
      </a-tab-pane>
      <a-tab-pane key="3" title="历史记录">
        <div class="history-table-custom">
          <table>
            <thead>
              <tr>
                <th>会员</th>
                <th>手机号</th>
                <th>备注</th>
                <th>操作类型</th>
                <th>操作时间</th>
                <th>操作人</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Jack</td>
                <td>15336388828</td>
                <td></td>
                <td>会员预约</td>
                <td>2025-04-27 20:06:33</td>
                <td>Jack</td>
              </tr>
            </tbody>
          </table>
        </div>
      </a-tab-pane>
    </a-tabs>
  </a-modal>

  <!-- 课程添加/编辑弹窗 -->
  <a-modal
    v-model:visible="editModalVisible"
    :title="isEditMode ? '编辑课程' : '添加课程'"
    :mask-closable="false"
    :width="420"
    @cancel="handleEditCancel"
    @ok="handleEditSave"
  >
    <a-form :model="editCourse" layout="vertical" :rules="editRules" ref="editFormRef">
      <a-form-item label="学生姓名" field="studentName" required>
        <a-input v-model="editCourse.studentName" placeholder="请输入学生姓名" allow-clear />
      </a-form-item>
      <a-form-item label="上课时间" required>
        <a-input v-model="editCourse.startTime" disabled />
      </a-form-item>
      <a-form-item label="上课日期" required>
        <a-input v-model="editCourse.dateLabel" disabled />
      </a-form-item>
      <a-form-item label="授课老师" field="teacherId" required>
        <a-select v-model="editCourse.teacherId" placeholder="请选择老师">
          <a-option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="状态" field="status" required>
        <a-select v-model="editCourse.status" placeholder="请选择状态">
          <a-option value="booked">已预约</a-option>
          <a-option value="available">可预约</a-option>
          <a-option value="completed">已完成</a-option>
        </a-select>
      </a-form-item>
      <a-form-item label="备注" field="remark">
        <a-textarea v-model="editCourse.remark" placeholder="请输入备注" allow-clear :auto-size="{ minRows: 2, maxRows: 4 }" />
      </a-form-item>
    </a-form>
  </a-modal>

  <!-- 增加课时弹窗 -->
  <a-modal
    v-model:visible="addSlotVisible"
    title="编辑老师时间"
    :mask-closable="false"
    :width="700"
    @ok="handleAddSlotOk"
    @cancel="handleAddSlotCancel"
    @close="handleAddSlotCancel"
  >
    <div class="edit-teacher-modal">
      <div class="row">
        <span class="label">老师：</span>
        <span class="value">{{ currentTeacherName }}</span>
      </div>
      <div class="row">
        <span class="label">在线教室：</span>
        <a-switch v-model="addSlotForm.online" />
        <span class="desc">开启后会生成在线直播教室，若想设置该控件为默认状态，请移步1对1设置</span>
      </div>
      <div class="row">
        <span class="label">选择日期：</span>
        <a-date-picker v-model="addSlotForm.dates" style="width: 220px;" :multiple="true" />
        <span class="desc">支持多选，可选择多个日期</span>
      </div>
      <div class="row">
        <a-tabs v-model:active-key="addSlotForm.timeType" type="line">
          <a-tab-pane v-for="tab in timeTabs" :key="tab.value" :title="tab.label" />
        </a-tabs>
      </div>
      <div class="row time-section">
        <div class="period-block">
          <div class="period-title">
            上午时间 <a-checkbox v-model="allChecked.morning" @change="val => handleCheckAll('morning', val)">全选</a-checkbox>
          </div>
          <div class="period-times">
            <a-checkbox v-for="t in timeOptions[addSlotForm.timeType].morning" :key="t" :value="t" v-model="addSlotForm.times" @change="() => handleTimeChange('morning')">{{ t }}</a-checkbox>
          </div>
        </div>
        <div class="period-block">
          <div class="period-title">
            下午时间 <a-checkbox v-model="allChecked.afternoon" @change="val => handleCheckAll('afternoon', val)">全选</a-checkbox>
          </div>
          <div class="period-times">
            <a-checkbox v-for="t in timeOptions[addSlotForm.timeType].afternoon" :key="t" :value="t" v-model="addSlotForm.times" @change="() => handleTimeChange('afternoon')">{{ t }}</a-checkbox>
          </div>
        </div>
        <div class="period-block">
          <div class="period-title">
            晚上时间 <a-checkbox v-model="allChecked.evening" @change="val => handleCheckAll('evening', val)">全选</a-checkbox>
          </div>
          <div class="period-times">
            <a-checkbox v-for="t in timeOptions[addSlotForm.timeType].evening" :key="t" :value="t" v-model="addSlotForm.times" @change="() => handleTimeChange('evening')">{{ t }}</a-checkbox>
          </div>
        </div>
        <div class="period-block">
          <div class="period-title">
            凌晨时间 <a-checkbox v-model="allChecked.night" @change="val => handleCheckAll('night', val)">全选</a-checkbox>
          </div>
          <div class="period-times">
            <a-checkbox v-for="t in timeOptions[addSlotForm.timeType].night" :key="t" :value="t" v-model="addSlotForm.times" @change="() => handleTimeChange('night')">{{ t }}</a-checkbox>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <a-button type="primary" @click="handleAddSlotOk">保存</a-button>
      <a-button @click="handleAddSlotCancel">取消</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { IconLeft, IconRight } from '@arco-design/web-vue/es/icon'
import { Message } from '@arco-design/web-vue'
import { listActiveTeachers } from '@/apis/education/teacher'
import dayjs from 'dayjs'

interface CourseSlot {
  id: string
  studentName: string
  teacherId: number
  startTime: string
  weekday: number
  status: 'booked' | 'available' | 'completed'
}

// 教师数据从后端获取
const teachers = ref<any[]>([])

onMounted(async () => {
  try {
    const res = await listActiveTeachers()
    if (res.data && Array.isArray(res.data)) {
      teachers.value = res.data
    }
  } catch (e) {
    teachers.value = []
  }
  // 默认选中第一个老师
  if (filteredTeachers.value.length > 0) {
    selectedTeacherId.value = filteredTeachers.value[0].id
  }
})

const teacherSearch = ref('')
const selectedTeacherId = ref<number | null>(null)

// 搜索过滤教师
const filteredTeachers = computed(() => {
  if (!teacherSearch.value) return teachers.value
  return teachers.value.filter(t => t.name.includes(teacherSearch.value))
})

// 切换教师
const handleSelectTeacher = (id: number) => {
  selectedTeacherId.value = id
}

// 当前周的周一日期
const getMonday = (date: Date) => {
  const d = new Date(date)
  const day = d.getDay() || 7
  if (day !== 1) d.setDate(d.getDate() - day + 1)
  d.setHours(0, 0, 0, 0)
  return d
}
const today = new Date()
const currentMonday = ref(getMonday(today))

// 明确 weekDays 类型
const weekDays = ref<{ label: string; date: string; fullDate: Date }[]>([])
const getWeekDays = (monday: Date) => {
  const arr: { label: string; date: string; fullDate: Date }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    arr.push({
      label: ['周一','周二','周三','周四','周五','周六','周日'][i],
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      fullDate: d
    })
  }
  return arr
}
weekDays.value = getWeekDays(currentMonday.value)

// 日期区间字符串
const dateRangeStr = ref('')
const updateDateRangeStr = () => {
  const start = weekDays.value[0]
  const end = weekDays.value[6]
  dateRangeStr.value = `${start.fullDate.getFullYear()}年${start.fullDate.getMonth() + 1}月${start.fullDate.getDate()}日 - ${end.fullDate.getMonth() + 1}月${end.fullDate.getDate()}日`
}
updateDateRangeStr()

// 切换上一周
const handlePrevWeek = () => {
  currentMonday.value.setDate(currentMonday.value.getDate() - 7)
  weekDays.value = getWeekDays(currentMonday.value)
  updateDateRangeStr()
}
// 切换下一周
const handleNextWeek = () => {
  currentMonday.value.setDate(currentMonday.value.getDate() + 7)
  weekDays.value = getWeekDays(currentMonday.value)
  updateDateRangeStr()
}
// 回到本周
const handleToday = () => {
  currentMonday.value = getMonday(new Date())
  weekDays.value = getWeekDays(currentMonday.value)
  updateDateRangeStr()
}

const timeSlots = reactive([
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
])

// 示例课程数据
const courseSlots = reactive<CourseSlot[]>([
  {
    id: '1',
    studentName: 'Ellie6',
    teacherId: 1,
    startTime: '19:30',
    weekday: 1,
    status: 'booked'
  },
  {
    id: '2',
    studentName: 'Winnie9',
    teacherId: 1,
    startTime: '20:00',
    weekday: 3,
    status: 'booked'
  },
  {
    id: '3',
    studentName: 'Freddy6',
    teacherId: 1,
    startTime: '20:30',
    weekday: 6,
    status: 'available'
  }
])

// 课程过滤：只显示选中老师或全部
const getCurrentWeekCourse = (timeSlot: string, dayIndex: number) => {
  const day = weekDays.value[dayIndex]
  if (!day) return null
  return courseSlots.find(s => {
    const slotDate = weekDays.value[s.weekday - 1]?.fullDate
    const matchTeacher = s.teacherId === selectedTeacherId.value
    return (
      s.startTime === timeSlot &&
      s.weekday === dayIndex + 1 &&
      slotDate &&
      slotDate.getFullYear() === day.fullDate.getFullYear() &&
      slotDate.getMonth() === day.fullDate.getMonth() &&
      slotDate.getDate() === day.fullDate.getDate() &&
      matchTeacher
    )
  })
}
// 获取课程样式
const getSlotClass = (timeSlot: string, dayIndex: number) => {
  const slot = getCurrentWeekCourse(timeSlot, dayIndex)
  return slot?.status
}
// 获取学生名字
const getSlotStudent = (timeSlot: string, dayIndex: number) => {
  const slot = getCurrentWeekCourse(timeSlot, dayIndex)
  return slot?.studentName || ''
}

// 课程详情相关
const courseDetailVisible = ref(false)
const selectedCourse = ref<CourseSlot | null>(null)

// 处理课程点击
const handleCourseClick = (timeSlot: string, dayIndex: number) => {
  const slot = getCurrentWeekCourse(timeSlot, dayIndex)
  if (slot) {
    selectedCourse.value = slot
    courseDetailVisible.value = true
  }
}

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colors = {
    booked: 'arcoblue',
    available: 'green',
    completed: 'gray'
  }
  return colors[status as keyof typeof colors]
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts = {
    booked: '已预约',
    available: '可预约',
    completed: '已完成'
  }
  return texts[status as keyof typeof texts]
}

// 处理弹窗确认
const handleModalOk = () => {
  Message.success('操作成功')
  courseDetailVisible.value = false
}

// 处理弹窗取消
const handleModalCancel = () => {
  courseDetailVisible.value = false
  selectedCourse.value = null
}

// 添加/编辑课程相关
const editModalVisible = ref(false)
const isEditMode = ref(false)
const editCourse = reactive<any>({})
const editFormRef = ref()

const editRules = {
  studentName: [{ required: true, message: '请输入学生姓名' }],
  teacherId: [{ required: true, message: '请选择老师' }],
  status: [{ required: true, message: '请选择状态' }],
}

// 打开添加弹窗
const handleAddCourse = (timeSlot: string, dayIndex: number) => {
  isEditMode.value = false
  Object.assign(editCourse, {
    id: '',
    studentName: '',
    teacherId: '',
    startTime: timeSlot,
    weekday: dayIndex + 1,
    dateLabel: weekDays.value[dayIndex].date,
    status: 'booked',
    remark: ''
  })
  editModalVisible.value = true
  nextTick(() => editFormRef.value?.resetFields())
}

// 打开编辑弹窗
const handleEditCourse = (slot: CourseSlot, dayIndex: number) => {
  isEditMode.value = true
  Object.assign(editCourse, {
    ...slot,
    dateLabel: weekDays.value[dayIndex].date
  })
  editModalVisible.value = true
  nextTick(() => editFormRef.value?.resetFields())
}

// 保存课程
const handleEditSave = async () => {
  await editFormRef.value?.validate()
  if (isEditMode.value) {
    // 编辑
    const idx = courseSlots.findIndex(s => s.id === editCourse.id)
    if (idx > -1) {
      Object.assign(courseSlots[idx], { ...editCourse })
      Message.success('课程已更新')
    }
  } else {
    // 添加
    const newId = Date.now().toString()
    courseSlots.push({
      ...editCourse,
      id: newId
    })
    Message.success('课程已添加')
  }
  editModalVisible.value = false
}

// 取消编辑
const handleEditCancel = () => {
  editModalVisible.value = false
}

// 新增：空白格点击添加
const handleCellClick = (timeSlot: string, dayIndex: number) => {
  const slot = getCurrentWeekCourse(timeSlot, dayIndex)
  if (!slot) {
    handleAddCourse(timeSlot, dayIndex)
  }
}

// 获取当前格子的课程信息和状态
const getSlotInfo = (timeSlot: string, dayIndex: number) => {
  const slot = getCurrentWeekCourse(timeSlot, dayIndex)
  if (slot) {
    return {
      status: slot.status,
      studentName: slot.studentName,
      time: timeSlot
    }
  }
  return {
    status: 'empty',
    studentName: '',
    time: timeSlot
  }
}

const currentTeacherName = computed(() => {
  const teacher = teachers.value.find(t => t.id === selectedTeacherId.value)
  return teacher ? teacher.name : ''
})

const addSlotVisible = ref(false)
const addSlotForm = ref<{
  online: boolean;
  tool: string;
  meetingId: string;
  meetingUrl: string;
  dates: dayjs.Dayjs[];
  timeType: string;
  times: string[];
}>({
  online: true,
  tool: 'classin_api',
  meetingId: '',
  meetingUrl: '',
  dates: [],
  timeType: '30',
  times: [],
})

const timeTabs = [
  { label: '30分钟档', value: '30' },
  { label: '10分钟档', value: '10' },
  { label: '5分钟档', value: '5' },
]

const timeOptions = {
  '30': {
    morning: ['06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'],
    afternoon: ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'],
    evening: ['18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30','23:00','23:30'],
    night: ['00:00','00:30','01:00','01:30','02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30'],
  },
  '10': {
    morning: [], afternoon: [], evening: [], night: [] // 可补充
  },
  '5': {
    morning: [], afternoon: [], evening: [], night: [] // 可补充
  }
}

const handleAddSlot = () => {
  addSlotVisible.value = true
}
const handleAddSlotOk = () => {
  Message.success('保存成功')
  addSlotVisible.value = false
  addSlotForm.value.dates = []
}
const handleAddSlotCancel = () => {
  addSlotVisible.value = false
  addSlotForm.value.dates = []
}

const allChecked = ref({ morning: false, afternoon: false, evening: false, night: false })
const handleCheckAll = (period, checked) => {
  allChecked.value[period] = checked
  const periodTimes = timeOptions[addSlotForm.value.timeType][period]
  if (checked) {
    addSlotForm.value.times = Array.from(new Set([...addSlotForm.value.times, ...periodTimes]))
  } else {
    addSlotForm.value.times = addSlotForm.value.times.filter(t => !periodTimes.includes(t))
  }
}
const isPeriodAllChecked = period => {
  const periodTimes = timeOptions[addSlotForm.value.timeType][period]
  return periodTimes.length > 0 && periodTimes.every(t => addSlotForm.value.times.includes(t))
}
const handleTimeChange = (period) => {
  allChecked.value[period] = isPeriodAllChecked(period)
}

watch(
  () => addSlotForm.value.dates,
  (val) => {
    if (!Array.isArray(val)) {
      addSlotForm.value.dates = []
      return
    }
    if (val.length === 0) return
    if (
      typeof val[0] === 'string' ||
      (typeof val[0] === 'object' && typeof val[0].format !== 'function')
    ) {
      addSlotForm.value.dates = val.map(d => dayjs(d))
    }
  },
  { deep: true }
)
</script>

<style scoped lang="less">
.schedule-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-1);
}

.top-bar {
  width: 100%;
  background: #f6faf8;
  border-radius: 20px 20px 0 0;
  box-sizing: border-box;
  padding: 24px 0 0 0;
  margin-bottom: 8px;
  .top-bar-inner {
    max-width: 1600px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 32px;
  }
  .teacher-info {
    font-size: 22px;
    font-weight: 500;
    color: #222;
    .teacher-name {
      font-size: 24px;
      font-weight: 700;
      color: #222;
      margin-left: 4px;
    }
  }
  .action-buttons {
    display: flex;
    gap: 8px;
    .arco-btn-group {
      gap: 8px;
    }
    .arco-btn {
      font-size: 15px;
      border-radius: 8px;
      padding: 0 16px;
    }
  }
}

.main-content {
  display: flex;
  flex: 1;
  min-height: 0;
  align-items: flex-start;
}

.teacher-list {
  width: 160px;
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  background: var(--color-bg-2);
  .search-box {
    padding: 8px 8px 0 8px;
    border-bottom: 1px solid var(--color-border);
  }
  .teacher-items {
    flex: 1;
    overflow-y: auto;
  }
  .teacher-item {
    padding: 8px 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    &:hover {
      background: var(--color-fill-2);
    }
  }
  .teacher-avatar {
    min-width: 36px;
    .arco-avatar {
      width: 36px !important;
      height: 36px !important;
      font-size: 16px !important;
    }
  }
}

.schedule-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.schedule-header {
  padding: 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .nav-actions {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .date-range {
    font-size: 20px;
    font-weight: 700;
    color: #222;
    text-align: center;
    letter-spacing: 1px;
    margin: 12px 0 0 0;
    width: 100%;
  }
}

.schedule-grid {
  flex: 1;
  overflow: auto;
  background: #fff;
  border-radius: 20px;
  margin: 24px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.04);
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--color-border);
  background: #fff;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  .day-column {
    padding: 16px 0 8px 0;
    text-align: center;
    border-right: 1px solid var(--color-border);
    .day-label {
      font-weight: 600;
      font-size: 16px;
    }
    .date-label {
      color: var(--color-text-3);
      margin-top: 4px;
      font-size: 15px;
    }
    &:last-child {
      border-right: none;
    }
  }
}

.time-grid {
  .time-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid var(--color-border);
    min-height: 48px;
    align-items: stretch;
    background: #fff;
  }
  .time-cell {
    height: 48px;
    border-right: 1px solid var(--color-border);
    padding: 0;
    position: relative;
    background: #fff;
    &:last-child {
      border-right: none;
    }
  }
}

.slot-card {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  border-radius: 6px;
  margin: 2px 0;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.06);
  background: #e5e6eb;
  cursor: pointer;
  transition: box-shadow 0.2s, background 0.2s;
  position: relative;
  padding-left: 10px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;
  .status-bar {
    width: 4px;
    height: 70%;
    border-radius: 2px;
    margin-right: 10px;
    background: #bcbcbc;
    flex-shrink: 0;
  }
  .slot-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #333;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    max-width: 100%;
  }
  .slot-time {
    font-weight: 600;
    font-size: 15px;
    flex-shrink: 0;
  }
  .slot-student {
    margin-left: 6px;
    font-size: 15px;
    font-weight: 500;
    flex-shrink: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70px;
  }
  &.booked {
    background: #1769ff;
    .status-bar { background: #1769ff; }
    .slot-content { color: #fff; }
  }
  &.available {
    background: #00b42a;
    .status-bar { background: #00b42a; }
    .slot-content { color: #fff; }
  }
  &.completed {
    background: #86909c;
    .status-bar { background: #86909c; }
    .slot-content { color: #fff; }
  }
  &.empty {
    background: #e5e6eb;
    .status-bar { background: #23c343; }
    .slot-content { color: #333; }
  }
  &:hover {
    box-shadow: 0 4px 16px 0 rgba(23,105,255,0.10);
    opacity: 0.95;
  }
}

.course-detail {
  padding: 16px;
  .detail-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 14px;
    .label {
      color: var(--color-text-3);
      width: 80px;
    }
    .value {
      color: var(--color-text-1);
    }
  }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  .detail-title {
    .date-time {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .teacher {
      font-size: 16px;
      color: var(--color-text-2);
    }
  }
  .detail-actions {
    display: flex;
    align-items: center;
  }
}
.detail-classroom {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f7f8fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  .classroom-info {
    font-size: 14px;
    line-height: 2;
    .bold { font-weight: 500; }
    .red { color: #f53f3f; }
    a { color: #1677ff; }
  }
  .classroom-action {
    margin-left: 32px;
    display: flex;
    align-items: flex-start;
  }
}
.detail-tabs {
  margin-top: 8px;
  .detail-table-custom {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    margin-top: 16px;
    .table-row {
      display: flex;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      .table-cell {
        flex: 1;
        border-right: 1px solid #f0f0f0;
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        &:last-child {
          border-right: none;
        }
        .cell-title {
          font-weight: 500;
          margin-bottom: 8px;
          color: #222;
        }
        .cell-content {
          font-size: 15px;
          color: #333;
          word-break: break-all;
          a {
            color: #1677ff;
          }
        }
      }
      .action {
        min-width: 140px;
        .cell-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
  }
}
.history-table-custom {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  margin-top: 16px;
  padding: 0 0 8px 0;
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    thead tr {
      background: #fafbfc;
      th {
        font-weight: 500;
        color: #222;
        padding: 14px 12px;
        text-align: left;
        border-bottom: 2px solid #f0f0f0;
      }
    }
    tbody tr {
      td {
        padding: 14px 12px;
        color: #333;
        font-size: 15px;
        border-bottom: 1px solid #f0f0f0;
      }
      &:last-child td {
        border-bottom: none;
      }
    }
  }
}
.time-cell-empty {
  width: 100%;
  height: 48px;
  cursor: pointer;
  border-radius: 8px;
  background: transparent;
  transition: background 0.2s;
  &:hover {
    background: #f2f3f5;
  }
}
.teacher-item.active {
  background: #e8f3ff;
  border-left: 4px solid #1769ff;
}
.edit-teacher-modal {
  .row {
    display: flex;
    align-items: center;
    margin-bottom: 18px;
    .label {
      min-width: 80px;
      color: #222;
      font-weight: 500;
      font-size: 16px;
    }
    .value {
      font-size: 18px;
      font-weight: 600;
      color: #1769ff;
      margin-right: 16px;
    }
    .desc {
      color: #86909c;
      font-size: 13px;
      margin-left: 12px;
    }
  }
  .time-section {
    display: flex;
    flex-wrap: wrap;
    gap: 24px 0;
    .period-block {
      flex: 1 1 45%;
      min-width: 320px;
      margin-bottom: 12px;
      .period-title {
        font-size: 15px;
        font-weight: 500;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .period-times {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 12px;
        .arco-checkbox {
          min-width: 70px;
          margin-bottom: 6px;
        }
      }
    }
  }
}
</style>
