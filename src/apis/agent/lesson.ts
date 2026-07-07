import http from '@/utils/http'

const BASE_URL = '/agent/lesson'

export interface AgentLessonResp {
  id: string
  courseId: string
  courseUid: string
  agentCode?: string
  activityUid: string
  classUid: string
  name: string
  teacherId: string
  teacherUid: string
  teacherName: string
  startTime: string
  endTime: string
  duration: number | string
  seatNum: number | string
  recordState: number | string
  liveState: string
  openState: string
  status: string
  estimatedCost?: number
  materialId?: string
  materialName?: string
  remark?: string
}

export interface AgentLessonDetailResp {
  id: string
  courseId: string
  courseUid: string
  agentCode?: string
  activityUid: string
  classUid: string
  name: string
  teacherId: string
  teacherUid: string
  teacherName: string
  startTime: string
  endTime: string
  duration: number | string
  seatNum: number | string
  recordState: number | string
  liveState: string
  openState: string
  uniqueIdentity: string
  liveUrl: string
  status: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  remark: string
}

export interface AgentLessonQuery {
  name: string | undefined
  courseStatus: string | undefined
  sort: Array<string>
}

export interface AgentLessonPageQuery extends AgentLessonQuery, PageQuery {}

export interface AgentLessonReq {
  courseId: string
  courseUid: string
  name: string
  teacherId: string
  startTime: string
  duration: number
  seatNum?: number
  recordState?: number
  remark?: string
}

/** @desc 分页查询代理课节列表 */
export function listAgentLessons(query?: AgentLessonPageQuery) {
  return http.get<PageRes<AgentLessonResp[]>>(BASE_URL, query)
}

/** @desc 查询代理课节详情 */
export function getAgentLesson(id: string) {
  return http.get<AgentLessonDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增代理课节 */
export function addAgentLesson(data: AgentLessonReq) {
  return http.post(BASE_URL, data)
}

/** @desc 修改代理课节 */
export function updateAgentLesson(data: AgentLessonReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除代理课节 */
export function deleteAgentLesson(id: string | string[]) {
  const ids = Array.isArray(id) ? id : [id]
  return http.del(BASE_URL, ids)
}

/** @desc 获取班级关联的教材ID */
export function getCourseMaterialId(courseId: string) {
  return http.get<string | null>(`${BASE_URL}/course-material/${courseId}`)
}

/** @desc 设置课堂关联教材 */
export function setLessonMaterial(lessonId: string, materialId: string | null, materialName: string | null) {
  const qs = new URLSearchParams()
  if (materialId != null) qs.set('materialId', String(materialId))
  if (materialName != null) qs.set('materialName', materialName)
  return http.put(`${BASE_URL}/${lessonId}/material?${qs.toString()}`, {})
}
