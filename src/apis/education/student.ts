import http from '@/utils/http'

const BASE_URL = '/education/student'

export interface StudentResp {
  name: string
  phone: string
  email: string
  registerTime: string
  agentId: string
  headImg: string
  password: string
  remark: string
  createTime: string
  institutionId: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface StudentDetailResp {
  id: string
  name: string
  gender: string
  phone: string
  email: string
  registerTime: string
  agentId: string
  headImg: string
  password: string
  remark: string
  status: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  institutionId: string
  createUserString: string
  updateUserString: string
}
export interface StudentQuery {
  name: string | undefined
  phone: string | undefined
  sort: Array<string>
}
export interface StudentPageQuery extends StudentQuery, PageQuery {}

/** @desc 查询学生管理列表 */
export function listStudent(query: StudentPageQuery) {
  return http.get<PageRes<StudentResp[]>>(BASE_URL, query)
}

/** @desc 查询学生管理详情 */
export function getStudent(id: string) {
  return http.get<StudentDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增学生管理 */
export function addStudent(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改学生管理 */
export function updateStudent(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除学生管理 */
export function deleteStudent(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出学生管理 */
export function exportStudent(query: StudentQuery) {
  return http.download(`${BASE_URL}/export`, query)
}
