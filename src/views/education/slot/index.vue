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
            <!-- 对每个时间槽，只有当时间槽在某天有数据时才显示 -->
            <div v-for="timeSlot in timeSlots" :key="timeSlot" class="time-row">
              <!-- 判断这个时间是否在任何日期有课时 -->
              <template v-if="hasAnySlotInWeek(timeSlot)">
                <div v-for="(day, dayIndex) in 7" :key="day" class="time-cell">
                  <!-- 只在有数据的情况下才显示格子 -->
                  <div
                    v-if="hasSlotOnDay(timeSlot, dayIndex)"
                    class="slot-card"
                    :class="getSlotInfo(timeSlot, dayIndex).status"
                    @click="handleCourseClick(timeSlot, dayIndex)"
                  >
                    <span class="status-bar" :class="getSlotInfo(timeSlot, dayIndex).status"></span>
                    <span class="slot-content">
                      <span class="slot-time">{{ timeSlot }}</span>
                      <span v-if="getSlotInfo(timeSlot, dayIndex).studentName" class="slot-student">{{ getSlotInfo(timeSlot, dayIndex).studentName }}</span>
                    </span>
                  </div>
                  <!-- 没有数据时显示空白 -->
                  <div v-else class="slot-empty"></div>
                </div>
              </template>
            </div>
          </div>
          
          <!-- 添加说明信息 -->
          <div v-if="timeSlots.length === 0" class="no-data-message">
            <a-empty description="该教师在当前日期范围内没有可用课时" />
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
    title="添加课时"
    :mask-closable="false"
    :width="420"
    @cancel="handleEditCancel"
    @ok="handleEditSave"
  >
    <a-form :model="editCourse" layout="vertical" ref="editFormRef">
      <a-form-item label="上课时间" required>
        <a-input v-model="editCourse.startTime" disabled />
      </a-form-item>
      <a-form-item label="上课日期" required>
        <a-input v-model="editCourse.dateLabel" disabled />
      </a-form-item>
      <a-form-item label="在线教室" field="isOnline">
        <a-switch v-model="editCourse.isOnline" />
        <span class="desc">开启后会生成在线教室</span>
      </a-form-item>
      <a-form-item label="课时时长" field="duration">
        <a-input-number v-model="editCourse.duration" :min="5" :max="120" :step="5" style="width: 100%" />
        <span class="desc">单位：分钟</span>
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
        <a-range-picker 
          v-model="addSlotForm.dateRange" 
          style="width: 320px;"
          allow-clear
        />
        <span class="desc">选择课程日期范围</span>
      </div>
      <div class="time-section">
        <div class="period-block">
          <div class="period-title">
            上午时间 <a-checkbox v-model="allChecked.morning" @change="val => handleCheckAll('morning', val)">全选</a-checkbox>
          </div>
          <div class="period-times">
            <a-checkbox v-for="t in timeOptions['30'].morning" :key="t" :value="t" v-model="addSlotForm.times" @change="() => handleTimeChange('morning')">{{ t }}</a-checkbox>
          </div>
        </div>
        <div class="period-block">
          <div class="period-title">
            下午时间 <a-checkbox v-model="allChecked.afternoon" @change="val => handleCheckAll('afternoon', val)">全选</a-checkbox>
          </div>
          <div class="period-times">
            <a-checkbox v-for="t in timeOptions['30'].afternoon" :key="t" :value="t" v-model="addSlotForm.times" @change="() => handleTimeChange('afternoon')">{{ t }}</a-checkbox>
          </div>
        </div>
        <div class="period-block">
          <div class="period-title">
            晚上时间 <a-checkbox v-model="allChecked.evening" @change="val => handleCheckAll('evening', val)">全选</a-checkbox>
          </div>
          <div class="period-times">
            <a-checkbox v-for="t in timeOptions['30'].evening" :key="t" :value="t" v-model="addSlotForm.times" @change="() => handleTimeChange('evening')">{{ t }}</a-checkbox>
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
import { Message, Modal } from '@arco-design/web-vue'
import { listActiveTeachers } from '@/apis/education/teacher'
import { batchCreateSlot, listSlot, getSlot, deleteSlot, addSlot, listAvailableSlots } from '@/apis/education/slot'
import dayjs from 'dayjs'

interface CourseSlot {
  id: string;
  studentName: string;
  teacherId: number;
  startTime: string;
  weekday: number | boolean;
  status: 'booked' | 'available' | 'completed';
  startDate?: string; // 添加startDate字段
}

// 教师数据从后端获取
const teachers = ref<any[]>([])

// 替换固定的时间槽为从API获取的数据
const timeSlots = ref<string[]>([])

// 加载时间槽配置
const loadTimeSlots = () => {
  const teacherId = selectedTeacherId.value;
  if (!teacherId) return;
  
  // 获取当前周的日期范围
  const startDate = weekDays.value[0].fullDate;
  const endDate = weekDays.value[6].fullDate;
  
  // 从接口获取可用时间槽
  listAvailableSlots(
    teacherId,
    dayjs(startDate).format('YYYYMMDD'),
    dayjs(endDate).format('YYYYMMDD')
  )
  .then(res => {
    if (res && res.data && res.data.length > 0) {
      // 提取所有可用时间段和对应的日期
      interface SlotInfo {
        date: string;
        time: string;
        weekday: any; // 使用any类型避免类型冲突
        id: number | null;
      }
      
      const availableSlots: SlotInfo[] = [];
      
      res.data.forEach((slot: any) => {
        if (slot.startTime && slot.startDate) {
          // 解析日期（格式：YYYYMMDD）为日、周几
          availableSlots.push({
            date: slot.startDate,
            time: slot.startTime,
            weekday: slot.weekday,
            id: typeof slot.id === 'number' ? slot.id : 0
          });
        }
      });
      
      console.log('从API加载了时间槽:', availableSlots.length, '个');
      
      // 更新课程槽数据，只包含API返回的记录
      courseSlots.splice(0, courseSlots.length);
      
      availableSlots.forEach(slot => {
        const teacherId = selectedTeacherId.value !== null ? selectedTeacherId.value : 0;
        
        // 添加到课程槽
        courseSlots.push({
          id: slot.id ? String(slot.id) : '0',
          studentName: '未被预约',
          teacherId: teacherId,
          startTime: slot.time,
          weekday: slot.weekday,
          status: 'available',
          startDate: slot.date
        });
      });
      
      // 提取唯一的时间段
      const uniqueTimes = [...new Set(availableSlots.map(slot => slot.time))].sort();
      timeSlots.value = uniqueTimes;
    } else {
      // 如果API没有返回数据，清空时间槽
      timeSlots.value = [];
      courseSlots.splice(0, courseSlots.length);
      console.log('API未返回时间槽数据');
    }
  })
  .catch(error => {
    console.error('获取时间槽数据失败:', error);
    // 错误时清空时间槽
    timeSlots.value = [];
    courseSlots.splice(0, courseSlots.length);
  });
}

onMounted(() => {
  // 加载教师数据
  listActiveTeachers()
    .then(res => {
      if (res.data && Array.isArray(res.data)) {
        teachers.value = res.data
        // 默认选中第一个老师
        if (teachers.value.length > 0) {
          selectedTeacherId.value = teachers.value[0].id
          loadCourseData() // 加载第一个老师的数据
        }
      }
    })
    .catch(e => {
      console.error('获取教师数据失败:', e)
      teachers.value = []
    })
  
  // 加载时间槽
  loadTimeSlots()
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
  loadCourseData() // 重新加载数据
}
// 切换下一周
const handleNextWeek = () => {
  currentMonday.value.setDate(currentMonday.value.getDate() + 7)
  weekDays.value = getWeekDays(currentMonday.value)
  updateDateRangeStr()
  loadCourseData() // 重新加载数据
}
// 回到本周
const handleToday = () => {
  currentMonday.value = getMonday(new Date())
  weekDays.value = getWeekDays(currentMonday.value)
  updateDateRangeStr()
  loadCourseData() // 重新加载数据
}

const courseSlots = reactive<CourseSlot[]>([])

// 加载课程数据
const loadCourseData = () => {
  const teacherId = selectedTeacherId.value;
  if (teacherId === null) return;
  
  // 构建查询参数，根据选中的教师ID和周的日期
  const startDate = weekDays.value[0].fullDate
  const endDate = weekDays.value[6].fullDate
  
  // 使用新的API查询可用课时
  listAvailableSlots(
    teacherId,
    dayjs(startDate).format('YYYYMMDD'),
    dayjs(endDate).format('YYYYMMDD')
  )
  .then(res => {
    // 清空现有数据
    courseSlots.splice(0, courseSlots.length)
    
    // 处理返回数据
    if (res && res.data) {
      const slots = res.data
      
      // 将API返回的数据转换为courseSlots需要的格式
      slots.forEach((slot: any) => {
        courseSlots.push({
          id: String(slot.id || 0),
          studentName: '未被预约',
          teacherId: slot.teacherId ? Number(slot.teacherId) : 0,
          startTime: slot.startTime,
          weekday: slot.weekday || 0,
          status: 'available',
          startDate: slot.startDate
        })
      })
      
      console.log('已加载课时数据:', courseSlots.length, '条记录')
    }
  })
  .catch(error => {
    console.error('加载课时数据失败:', error)
    Message.error('加载课时数据失败')
  })
}

// 监听教师和日期变化，重新加载数据
watch(() => selectedTeacherId.value, (newVal) => {
  if (newVal) {
    // 暂时只加载时间槽
    loadTimeSlots()
  } else {
    courseSlots.splice(0, courseSlots.length)
  }
})

watch(() => currentMonday.value, () => {
  // 暂时只加载时间槽
  loadTimeSlots()
})

// 课程过滤：只显示选中老师或全部
const getCurrentWeekCourse = (timeSlot: string, dayIndex: number) => {
  const day = weekDays.value[dayIndex]
  if (!day) return null
  
  // 将当前日期格式化为YYYYMMDD格式以便于与API返回的格式进行比较
  const formattedDate = dayjs(day.fullDate).format('YYYYMMDD')
  
  return courseSlots.find(s => {
    // 明确匹配时间段和日期
    return (
      s.startTime === timeSlot &&
      s.startDate === formattedDate // 直接比较API返回的startDate字段
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
    // 显示询问弹窗
    const dateStr = dayjs(weekDays.value[dayIndex].fullDate).format('YYYY-MM-DD')
    
    // 使用确认弹窗询问用户是否要删除
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 ${dateStr} ${timeSlot} 的课时吗？`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { status: 'danger' },
      onOk: () => {
        // 确认删除
        deleteSlot(slot.id)
          .then(res => {
            if (res.success) {
              Message.success('课时已删除')
              
              // 仅刷新时间槽数据
              loadTimeSlots()
            } else {
              Message.error('删除失败: ' + (res.msg || '未知错误'))
            }
          })
          .catch(error => {
            console.error('删除课时失败:', error)
            Message.error('删除失败:' + (error.message || '未知错误'))
          })
      }
    })
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
  const currentDate = weekDays.value[dayIndex].fullDate
  Object.assign(editCourse, {
    id: '',
    teacherId: selectedTeacherId.value, // 默认选中当前教师
    startTime: timeSlot,
    weekday: dayIndex + 1,
    dateLabel: weekDays.value[dayIndex].date,
    formattedDate: dayjs(currentDate).format('YYYY-MM-DD'), // 用于API请求
    status: 'available', // 默认为可用状态
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
const handleEditSave = () => {
  editFormRef.value?.validate()
    .then(() => {
      const formattedDate = editCourse.formattedDate.replace(/-/g, '')
      
      // 准备单个课时创建请求
      const slotReq = {
        teacherId: editCourse.teacherId,
        teacherName: currentTeacherName.value,
        startDate: formattedDate,
        startTime: editCourse.startTime,
        isOnline: addSlotForm.value.online,
        duration: 30, // 默认30分钟
      }
      
      // 调用创建API
      return addSlot(slotReq)
    })
    .then(res => {
      if (res.success) {
        Message.success('课时已添加')
        
        // 刷新时间槽
        loadTimeSlots()
        
        // 如果当前时间槽列表中不包含刚添加的时间，重新刷新整个页面的时间槽
        if (!timeSlots.value.includes(editCourse.startTime)) {
          console.log('添加了新时间段，重新加载时间槽')
          loadTimeSlots()
        }
      } else {
        Message.error('添加课时失败: ' + res.msg)
      }
      
      editModalVisible.value = false
    })
    .catch(error => {
      console.error('保存课时出错:', error)
      Message.error('添加课时失败')
    })
}

// 取消编辑
const handleEditCancel = () => {
  editModalVisible.value = false
}

// 新增：空白格点击添加
const handleCellClick = (timeSlot: string, dayIndex: number) => {
  const day = weekDays.value[dayIndex]
  handleAddCourse(timeSlot, dayIndex)
}

// 获取当前格子的课程信息和状态
const getSlotInfo = (timeSlot: string, dayIndex: number) => {
  const slot = getCurrentWeekCourse(timeSlot, dayIndex)
  if (slot) {
    // 判断是否有学生预约，如果显示的是"未被预约"，则状态为available
    const isBooked = slot.studentName && slot.studentName !== '未被预约';
    
    return {
      status: isBooked ? 'booked' : 'available', // 根据是否有学生名判断状态
      studentName: isBooked ? slot.studentName : '未被预约', // 有学生名显示学生名，否则显示"未被预约"
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
  dateRange: any; // 日期范围
  timeType: string;
  times: string[];
}>({
  online: true,
  tool: 'classin_api',
  meetingId: '',
  meetingUrl: '',
  dateRange: null, // 初始为null
  timeType: '30',
  times: [],
})


const timeOptions = {
  '30': {
    morning: ['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30'],
    afternoon: ['12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'],
    evening: ['17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00','21:30','22:00','22:30'],
  },
  '10': {
    morning: [], afternoon: [], evening: [], night: [] // 可补充
  },
  '5': {
    morning: [], afternoon: [], evening: [], night: [] // 可补充
  }
}

const handleAddSlot = () => {
  addSlotForm.value = {
    online: true,
    tool: 'classin_api',
    meetingId: '',
    meetingUrl: '',
    dateRange: null,
    timeType: '30',
    times: [],
  }
  console.log('打开添加课程弹窗，初始化表单:', addSlotForm.value);
  addSlotVisible.value = true
}
const handleAddSlotOk = async () => {
  // 检查表单数据
  if (!addSlotForm.value.dateRange || !Array.isArray(addSlotForm.value.dateRange) || addSlotForm.value.dateRange.length !== 2) {
    Message.error('请选择日期范围');
    console.error('日期范围未选择，无法提交');
    return;
  }
  
  console.log('表单中的日期范围数据:', addSlotForm.value.dateRange);
  
  if (addSlotForm.value.times.length === 0) {
    Message.error('请选择至少一个时间段');
    return;
  }
  
  if (!selectedTeacherId.value) {
    Message.error('请选择老师');
    return;
  }
  
  try {
    // 准备请求数据
    const formattedDates = processDateRange(addSlotForm.value.dateRange);
    
    if (formattedDates.length === 0) {
      Message.error('日期范围处理失败，请重新选择日期');
      return;
    }
    
    const batchReq = {
      teacherId: selectedTeacherId.value,
      teacherName: currentTeacherName.value,
      online: addSlotForm.value.online,
      tool: addSlotForm.value.tool,
      meetingId: addSlotForm.value.meetingId,
      meetingUrl: addSlotForm.value.meetingUrl,
      dates: formattedDates,
      times: addSlotForm.value.times
    };
    
    // 打印请求数据，用于调试
    console.log('批量创建课程时间请求数据:', JSON.stringify(batchReq));
    
    // 调用批量创建API
    const res = await batchCreateSlot(batchReq);
    
    // 打印响应数据，用于调试
    console.log('批量创建课程时间响应数据:', res);
    
    // 处理响应
    if (res && res.data) {
      const slotCount = Array.isArray(res.data) ? res.data.length : 0;
      Message.success(`成功创建${slotCount}个课程时间`);
      
      // 关闭弹窗
      addSlotVisible.value = false;
      
      // 重置表单
      addSlotForm.value.dateRange = null;
      addSlotForm.value.times = [];
      
      // 刷新时间槽数据
      loadTimeSlots();
    } else {
      Message.error('创建成功，但返回数据为空');
      // 关闭弹窗
      addSlotVisible.value = false;
      // 重置表单
      addSlotForm.value.dateRange = null;
      addSlotForm.value.times = [];
      
      // 仍然刷新时间槽数据
      loadTimeSlots();
    }
  } catch (error: any) {
    console.error('创建课程时间失败:', error);
    Message.error('创建失败:' + (error.message || '未知错误'));
  }
}
const handleAddSlotCancel = () => {
  addSlotVisible.value = false
  addSlotForm.value.dateRange = null
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

watch(() => addSlotForm.value.dateRange, (newVal) => {
  console.log('dateRange 值变化:', newVal);
  // 确保值始终是数组
  if (newVal && !Array.isArray(newVal)) {
    addSlotForm.value.dateRange = newVal ? [newVal] : [];
  }
}, { deep: true });

// 处理日期范围，生成范围内所有日期的数组
const processDateRange = (dateRange: any[]): string[] => {
  if (!dateRange || !Array.isArray(dateRange) || dateRange.length !== 2) {
    console.error('无效的日期范围');
    return [];
  }
  
  try {
    const startDate = dayjs(dateRange[0]);
    const endDate = dayjs(dateRange[1]);
    
    if (!startDate.isValid() || !endDate.isValid()) {
      console.error('日期范围中存在无效日期');
      return [];
    }
    
    const formattedDates: string[] = [];
    let currentDate = startDate;
    
    // 循环添加范围内的每一天
    while (currentDate.valueOf() <= endDate.valueOf()) {
      formattedDates.push(currentDate.format('YYYY-MM-DD'));
      currentDate = currentDate.add(1, 'day');
    }
    
    console.log('日期范围生成的所有日期:', formattedDates);
    return formattedDates;
  } catch (error) {
    console.error('处理日期范围出错:', error);
    return [];
  }
};

// 判断某天某时间段是否有课时
const hasSlotOnDay = (timeSlot: string, dayIndex: number): boolean => {
  const day = weekDays.value[dayIndex]
  if (!day) return false
  
  // 将当前日期格式化为YYYYMMDD格式
  const formattedDate = dayjs(day.fullDate).format('YYYYMMDD')
  
  // 检查是否有匹配的课程
  return courseSlots.some(slot => 
    slot.startTime === timeSlot && 
    slot.startDate === formattedDate
  )
}

// 新增：判断某个时间是否在任何日期有课时
const hasAnySlotInWeek = (timeSlot: string): boolean => {
  // 检查是否有任何一天在这个时间点有课程
  return courseSlots.some(slot => slot.startTime === timeSlot);
}
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
  background: #e5e6eb; /* 默认灰色背景 */
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
    background: #bcbcbc; /* 默认灰色状态条 */
    flex-shrink: 0;
  }
  
  .slot-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    color: #fff; /* 文本颜色为白色 */
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
  
  /* 未被预约的状态 - 灰色 */
  &.available {
    background: #bbbec4; /* 灰色背景 */
    
    .status-bar {
      background: #bbbec4;
    }
    
    .slot-content {
      color: #fff;
    }
  }
  
  /* 已预约的状态 - 蓝色 */
  &.booked {
    background: #1890ff; /* 蓝色背景 */
    
    .status-bar {
      background: #1890ff;
    }
    
    .slot-content {
      color: #fff;
    }
  }
  
  &.completed {
    background: #86909c;
    
    .status-bar {
      background: #86909c;
    }
    
    .slot-content {
      color: #fff;
    }
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
    flex-direction: column;
    gap: 0;
    .period-block {
      margin-bottom: 32px;
      width: 100%;
      .period-title {
        font-size: 15px;
        font-weight: 500;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .period-times {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px 0;
        .arco-checkbox {
          min-width: 100px;
          margin-bottom: 0;
          font-size: 15px;
          justify-content: flex-start;
        }
      }
    }
  }
}
.slot-empty {
  height: 60px;
  width: 100%;
  box-sizing: border-box;
  border-right: 1px solid #f2f2f2;
  border-bottom: 1px solid #f2f2f2;
}
</style>
