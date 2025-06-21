import http from '@/utils/http'

const BASE_URL = '/education/course'

export interface CourseResp {
  name: string
  mainTeacherId: string
  mainTeacherUid: string
  courseUid: string
  courseSettingId: string
  institutionId: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
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
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}
export interface CourseQuery {
  name: string | undefined
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
