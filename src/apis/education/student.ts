import http from '@/utils/http'

const BASE_URL = '/education/student'

export interface StudentResp {
  id: string
  name: string
  phone: string
  email: string
  registerTime: string
  agentId: string
  avatar: string
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
  /** 性别（male-男 female-女） */
  gender: string
  phone: string
  email: string
  registerTime: string
  agentId: string
  avatar: string
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

export interface StudentBatchImportReq {
  importData: string
}

export interface StudentBatchImportResp {
  successCount: number
  failureCount: number
  failures: Array<{
    studentName: string
    phone: string
    reason: string
  }>
}

/** @desc 批量导入学生 */
export function batchImportStudent(data: StudentBatchImportReq) {
  return http.post<StudentBatchImportResp>(`${BASE_URL}/batch-import`, data)
}

export interface StudentSetPasswordReq {
  studentId: number
  password: string
}

/** @desc 设置学生密码 */
export function setStudentPassword(data: StudentSetPasswordReq) {
  return http.patch('/education/credential/set-password', {
    userType: 'student',
    userId: data.studentId,
    password: data.password
  })
}

export interface StudentVerifyPasswordReq {
  phone: string
  password: string
}

export interface StudentVerifyPasswordResp {
  success: boolean
  studentId?: number
  studentName?: string
  errorCount: number
  remainingAttempts: number
  frozen: boolean
  unfreezeTime?: string
  message: string
}

/** @desc 验证学生密码 */
export function verifyStudentPassword(data: StudentVerifyPasswordReq) {
  return http.post<StudentVerifyPasswordResp>(`${BASE_URL}/verify-password`, data)
}
