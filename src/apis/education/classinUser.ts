import http from '@/utils/http'

const BASE_URL = '/education/classinUser'

export interface ClassinUserResp {
  nickname: string
  userType: string
  uid: string
  telephone: string
  studentId: string
  teacherId: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface ClassinUserDetailResp {
  id: string
  nickname: string
  userType: string
  uid: string
  password: string
  telephone: string
  email: string
  studentId: string
  teacherId: string
  classinInstitutionId: string
  status: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}
export interface ClassinUserQuery {
  nickname: string | undefined
  userType: string | undefined
  telephone: string | undefined
  sort: Array<string>
}
export interface ClassinUserPageQuery extends ClassinUserQuery, PageQuery {}

/** @desc 查询Classin用户列表 */
export function listClassinUser(query: ClassinUserPageQuery) {
  return http.get<PageRes<ClassinUserResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询Classin用户详情 */
export function getClassinUser(id: string) {
  return http.get<ClassinUserDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增Classin用户 */
export function addClassinUser(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改Classin用户 */
export function updateClassinUser(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除Classin用户 */
export function deleteClassinUser(id: string) {
  return http.del(`${BASE_URL}/${id}`)
}

/** @desc 导出Classin用户 */
export function exportClassinUser(query: ClassinUserQuery) {
  return http.download(`${BASE_URL}/export`, query)
}
