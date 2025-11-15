import http from '@/utils/http'

const BASE_URL = '/education/teacher'

export interface TeacherResp {
  id: number
  name: string
  teacherNo: string
  score: string
  tags: string
  gender: string
  isShow: string
  isFixed: string
  phone: string
  email: string
  headImg: string
  audioUrl: string
  videoUrl: string
  briefIntro: string
  description: string
  groupName: string
  sort: string
  status: string
  recvName: string
  createTime: string
  updateTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}

/** @desc 查询所有状态为活跃的教师列表 */
export function listActiveTeachers(name?: string) {
  return http.get<TeacherResp[]>(`${BASE_URL}/active`, { name })
}

/** @desc 搜索教师（根据姓名或手机号） */
export function searchTeachers(keyword: string) {
  return http.get<TeacherResp[]>(`${BASE_URL}/search`, { keyword })
}

export interface TeacherDetailResp {
  id: string
  name: string
  teacherNo: string
  score: string
  tags: string
  gender: string
  isShow: string
  isFixed: string
  phone: string
  email: string
  headImg: string
  audioUrl: string
  videoUrl: string
  briefIntro: string
  description: string
  groupName: string
  sort: string
  status: string
  recvName: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}

export interface TeacherQuery {
  name: string | undefined
  teacherNo: string | undefined
  isShow: string | undefined
  groupName: string | undefined
}

export interface TeacherPageQuery extends TeacherQuery, PageQuery {}

/** @desc 查询教师列表 */
export function listTeacher(query: TeacherPageQuery) {
  return http.get<PageRes<TeacherResp[]>>(`${BASE_URL}`, query)
}

/** @desc 查询教师详情 */
export function getTeacher(id: string) {
  return http.get<TeacherDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增教师 */
export function addTeacher(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/** @desc 修改教师 */
export function updateTeacher(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除教师 */
export function deleteTeacher(id: string) {
  return http.del(`${BASE_URL}/${id}`)
}

/** @desc 导出教师 */
export function exportTeacher(query: TeacherQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

export interface TeacherSetPasswordReq {
  teacherId: number
  password: string
}

/** @desc 设置教师密码 */
export function setTeacherPassword(data: TeacherSetPasswordReq) {
  return http.patch('/education/credential/set-password', {
    userType: 'teacher',
    userId: data.teacherId,
    password: data.password
  })
}
