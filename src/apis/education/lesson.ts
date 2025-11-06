import http from '@/utils/http'

const BASE_URL = '/education/lesson'

export interface LessonResp {
  id: string
  courseId: string
  courseUid: string
  activityUid: string
  classUid: string
  unitUid: string
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
  createUser: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface LessonDetailResp {
  id: string
  courseId: string
  courseUid: string
  activityUid: string
  classUid: string
  unitUid: string
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
  rtmpUrl: string
  hlsUrl: string
  flvUrl: string
  status: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  remark: string
  createUserString: string
  updateUserString: string
}
export interface LessonQuery {
  courseId: string | undefined
  courseUid: string | undefined
  name: string | undefined
  teacherUid: string | undefined
  startTime: string | undefined
  endTime: string | undefined
  sort: Array<string>
}
export interface LessonPageQuery extends LessonQuery, PageQuery {}

/** @desc 查询课堂列表 */
export function listLesson(query: LessonPageQuery) {
  return http.get<PageRes<LessonResp[]>>(BASE_URL, query)
}

/** @desc 查询课堂详情 */
export function getLesson(id: string) {
  return http.get<LessonDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增课堂 */
export function addLesson(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改课堂 */
export function updateLesson(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除课堂 */
export function deleteLesson(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出课堂 */
export function exportLesson(query: LessonQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 获取班级的课节列表 */
export function listCourseLessons(courseId: string) {
  return http.get<LessonResp[]>(`/education/course/lesson/${courseId}`)
}
