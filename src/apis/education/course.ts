import http from '@/utils/http'

const BASE_URL = '/education/course'

export interface CourseResp {
  id: string
  name: string
  mainTeacherId: string
  mainTeacherName?: string
  mainTeacherUid: string
  courseUid: string
  courseSettingId: string
  institutionId: string
  institutionName?: string
  agentCode?: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
  teachers?: CourseTeacherResp[]
  students?: CourseStudentResp[]
  teacherCount?: number
  studentCount?: number
}
export interface CourseDetailResp {
  id: string
  name: string
  mainTeacherId: string
  mainTeacherUid: string
  courseUnique: string
  courseUid: string
  courseSettingId: string
  status: string
  institutionId: string
  agentCode?: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
  teachers?: CourseTeacherResp[]
  students?: CourseStudentResp[]
}

export interface CourseTeacherResp {
  id: string
  courseId: string
  courseName: string
  teacherId: string
  teacherName: string
  teacherUid: string
  teacherPhone?: string
  teacherEmail?: string
  status: number
}

export interface CourseStudentResp {
  id: string
  courseId: string
  courseName: string
  studentId: string
  studentName: string
  studentUid: string
  studentPhone?: string
  studentEmail?: string
  status: number
}

export interface CourseTeacherReq {
  courseId: string
  teacherIds: string[]
}

export interface CourseStudentReq {
  courseId: string
  studentIds: string[]
}

export interface CourseScheduleResp {
  id: string
  courseId: string
  teacherId: string
  teacherName: string
  weekDay: number
  startTime: string
  durationMinutes: number
  enableRecording: number
  onStage?: number
  remark?: string
}

export interface CourseScheduleReq {
  courseId: string
  teacherId: string
  weekDay: number
  startTime: string
  durationMinutes: number
  enableRecording?: number
  onStage?: number
  remark?: string
}
export interface CourseQuery {
  name: string | undefined
  agentCode: string | undefined
  mainTeacherId: string | undefined
  institutionId: string | undefined
  sort: Array<string>
}
export interface CoursePageQuery extends CourseQuery, PageQuery {}

/** @desc 查询班级列表 */
export function listCourse(query: CoursePageQuery) {
  return http.get<PageRes<CourseResp[]>>(BASE_URL, query)
}

/** @desc 查询班级详情 */
export function getCourse(id: string) {
  return http.get<CourseDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增班级 */
export function addCourse(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改班级 */
export function updateCourse(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除班级 */
export function deleteCourse(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出班级 */
export function exportCourse(query: CourseQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 为班级添加老师 */
export function addTeachersToCourse(data: CourseTeacherReq) {
  return http.post(`${BASE_URL}/teacher`, data)
}

/** @desc 从班级移除老师 */
export function removeTeacherFromCourse(courseId: string, teacherId: string) {
  return http.del(`${BASE_URL}/teacher/${courseId}/${teacherId}`)
}

/** @desc 获取班级的老师列表 */
export function listCourseTeachers(courseId: string) {
  return http.get<CourseTeacherResp[]>(`${BASE_URL}/teacher/${courseId}`)
}

/** @desc 为班级添加学生 */
export function addStudentsToCourse(data: CourseStudentReq) {
  return http.post(`${BASE_URL}/student`, data)
}

/** @desc 从班级移除学生 */
export function removeStudentFromCourse(courseId: string, studentId: string) {
  return http.del(`${BASE_URL}/student/${courseId}/${studentId}`)
}

/** @desc 获取班级的学生列表 */
export function listCourseStudents(courseId: string) {
  return http.get<CourseStudentResp[]>(`${BASE_URL}/student/${courseId}`)
}

/** @desc 获取班级的固定课时间列表 */
export function listCourseSchedules(courseId: string) {
  return http.get<CourseScheduleResp[]>(`${BASE_URL}/schedule/${courseId}`)
}

/** @desc 获取固定课时间详情 */
export function getCourseSchedule(id: string) {
  return http.get<CourseScheduleResp>(`${BASE_URL}/schedule/detail/${id}`)
}

/** @desc 创建固定课时间 */
export function createCourseSchedule(data: CourseScheduleReq) {
  return http.post<string>(`${BASE_URL}/schedule`, data)
}

/** @desc 更新固定课时间 */
export function updateCourseSchedule(id: string, data: CourseScheduleReq) {
  return http.put(`${BASE_URL}/schedule/${id}`, data)
}

/** @desc 删除固定课时间 */
export function deleteCourseSchedule(id: string) {
  return http.del(`${BASE_URL}/schedule/${id}`)
}

/** @desc 批量删除固定课时间 */
export function deleteCourseScheduleBatch(ids: string[]) {
  return http.del(`${BASE_URL}/schedule/batch`, { ids })
}

export interface BatchScheduleReq {
  courseIds: string[]
  startDate: string
  weekCount: number
  checkConflict?: boolean
}

export interface ConflictInfo {
  courseId: string
  courseName: string
  scheduleId: string
  conflictTime: string
  conflictReason: string
  teacherName: string
}

export interface LessonSummary {
  lessonId: string
  courseName: string
  teacherName: string
  startTime: string
  lessonName: string
}

export interface BatchScheduleResp {
  successCount: number
  failCount: number
  totalSchedules: number
  conflictLessons: ConflictInfo[]
  createdLessons: LessonSummary[]
}

export interface CheckScheduleResp {
  totalLessons: number
  scheduledCount: number
  unscheduledCount: number
  lessons: CheckScheduleItem[]
}

export interface CheckScheduleItem {
  courseName: string
  startTime: string
  isScheduled: boolean
  lessonName?: string
  teacherName?: string
}

/** @desc 批量排课 */
export function batchScheduleCourse(data: BatchScheduleReq) {
  return http.post<BatchScheduleResp>(`${BASE_URL}/batch-schedule`, data)
}

/** @desc 检查排课状态 */
export function checkScheduleStatus(data: BatchScheduleReq) {
  return http.post<CheckScheduleResp>(`${BASE_URL}/check-schedule`, data)
}
