import http from '@/utils/http'

const BASE_URL = '/education/booking'

export interface BookingResp {
  slotId: string
  startDate: string
  startTime: string
  studentName: string
  phone: string
  cardId: string
  cardName: string
  operatorName: string
  operateTime: string
  materialName: string
  remark: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface BookingDetailResp {
  id: string
  slotId: string
  startDate: string
  startTime: string
  studentId: string
  studentName: string
  phone: string
  cardId: string
  cardName: string
  operatorName: string
  operateTime: string
  materialId: string
  materialName: string
  lessonName: string
  materialUrl: string
  remark: string
  status: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}
export interface BookingQuery {
  studentName: string | undefined
  cardName: string | undefined
  createUser: string | undefined
  sort: Array<string>
}
export interface BookingPageQuery extends BookingQuery, PageQuery {}

/** @desc 查询预约列表 */
export function listBooking(query: BookingPageQuery) {
  return http.get<PageRes<BookingResp[]>>(BASE_URL, query)
}

/** @desc 查询预约详情 */
export function getBooking(id: string) {
  return http.get<BookingDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增预约 */
export function addBooking(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改预约 */
export function updateBooking(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除预约 */
export function deleteBooking(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出预约 */
export function exportBooking(query: BookingQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 取消预约 */
export function cancelBooking(bookingId: string) {
  return http.post(`${BASE_URL}/${bookingId}/cancel`)
}

/** @desc 教师取消预约 */
export function cancelBookingByTeacher(bookingId: string) {
  return http.post(`${BASE_URL}/${bookingId}/cancel-by-teacher`)
}

/** @desc 通过时间段和学生取消预约 */
export function cancelBookingBySlotAndStudent(slotId: string, studentId: string) {
  return http.post(`${BASE_URL}/cancel-by-slot`, { slotId, studentId })
}
