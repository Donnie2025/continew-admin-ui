import http from '@/utils/http'

const BASE_URL = '/education/fixed'

export interface FixedResp {
  id: string
  teacherId: string
  teacherName: string
  durationMinutes: number
  maxStudents: number
  weekDay: number
  startTime: string
  status: number
  bookedCount: number
  studentNames?: string[]
  studentPhones?: string[]
  isBooked?: boolean
  isMyBooking?: boolean
  createTime: string
  updateTime: string
}

export interface FixedQuery {
  teacherId?: string
  teacherName?: string
  weekDay?: number
  status?: number
  sort?: Array<string>
}

export interface FixedPageQuery extends FixedQuery, PageQuery {}

export interface FixedReq {
  teacherId: string
  weekDay: number
  startTime: string
  durationMinutes: number
  maxStudents: number
}

/** @desc 分页查询固定课列表 */
export function listFixed(query: FixedPageQuery) {
  return http.get<PageRes<FixedResp[]>>(BASE_URL, query)
}

/** @desc 查询固定课详情 */
export function getFixed(id: string) {
  return http.get<FixedResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增固定课 */
export function addFixed(data: FixedReq) {
  return http.post(BASE_URL, data)
}

/** @desc 修改固定课 */
export function updateFixed(data: FixedReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除固定课 */
export function deleteFixed(ids: string[]) {
  return http.del(BASE_URL, { ids })
}

/** @desc 导出固定课 */
export function exportFixed(query: FixedQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 检查时间冲突 */
export function checkTimeConflict(
  teacherId: string, 
  weekDays: number[], 
  startTimes: string[], 
  durationMinutes: number,
  maxStudents: number,
  excludeId?: string
) {
  return http.post<boolean>(`${BASE_URL}/conflict/batch`, {
    teacherId,
    weekDays,
    startTimes,
    durationMinutes,
    maxStudents,
    excludeId
  })
}

/** @desc 批量新增固定课 */
export function batchAddFixed(data: {
  teacherId: string
  weekDays: number[]
  startTimes: string[]
  durationMinutes: number
  maxStudents: number
}) {
  return http.post(`${BASE_URL}/batch`, data)
}

/** @desc 获取固定课的预约学生列表 */
export function getFixedBookings(fixedId: string) {
  return http.get<any[]>(`${BASE_URL}/${fixedId}/bookings`)
}

/** @desc 为固定课添加学生预约 */
export function addFixedBooking(data: { fixedId: string; studentId: string }) {
  return http.post(`${BASE_URL}/booking`, data)
}

/** @desc 取消学生预约 */
export function deleteFixedBooking(id: string) {
  return http.del(`${BASE_URL}/booking/${id}`)
}

/** @desc 根据教师ID查询固定课列表 */
export function listFixedByTeacherId(teacherId: string) {
  return http.get<FixedResp[]>(`${BASE_URL}/teacher/${teacherId}`)
}

/** @desc 根据学生ID查询固定课预约列表 */
export function listFixedByStudentId(studentId: string) {
  return http.get<FixedResp[]>(`${BASE_URL}/student/${studentId}`)
}

/** @desc 根据学生ID查询固定课预约记录列表 */
export function listBookingRecordsByStudentId(studentId: string) {
  return http.get<any[]>(`${BASE_URL}/student/${studentId}/records`)
}
