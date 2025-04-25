import http from '@/utils/http'

const BASE_URL = '/education/slot'

export interface SlotResp {
  teacherId: string
  teacherName: string
  startDate: string
  startTime: string
  weekday: string
  duration: string
  isOnline: string
  status: string
  createTime: string
  institutionId: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface SlotDetailResp {
  id: string
  teacherId: string
  teacherName: string
  startDate: string
  startTime: string
  weekday: string
  duration: string
  isOnline: string
  status: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  institutionId: string
  createUserString: string
  updateUserString: string
}
export interface SlotQuery {
  teacherName: string | undefined
  startDate: string | undefined
  sort: Array<string>
}
export interface SlotPageQuery extends SlotQuery, PageQuery {}

/** @desc 查询课程管理列表 */
export function listSlot(query: SlotPageQuery) {
  return http.get<PageRes<SlotResp[]>>(BASE_URL, query)
}

/** @desc 查询课程管理详情 */
export function getSlot(id: string) {
  return http.get<SlotDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增课程管理 */
export function addSlot(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改课程管理 */
export function updateSlot(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除课程管理 */
export function deleteSlot(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出课程管理 */
export function exportSlot(query: SlotQuery) {
  return http.download(`${BASE_URL}/export`, query)
}
