import http from '@/utils/http'

const BASE_URL = '/api/education/account'

export interface AccountResp {
  id: string
  studentId: string
  studentName: string
  accountType: string
  accountTypeName: string
  balance: number
  expireDate: string | null
  status: number
  remark: string
  createTime: string
  updateTime: string
}

/** @desc 获取学生账户信息（PAID账户） */
export function getStudentAccount(studentId: number | string) {
  return http.get<AccountResp>(`${BASE_URL}/student/${studentId}`)
}

/** @desc 获取学生所有账户列表 */
export function getStudentAccounts(studentId: number | string) {
  return http.get<AccountResp[]>(`${BASE_URL}/student/${studentId}/all`)
}
