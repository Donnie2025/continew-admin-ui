import http from '@/utils/http'

const BASE_URL = '/education/salary'

export interface SalaryResp {
  id: string
  teacherId: string
  teacherName: string
  startDate: string
  endDate: string
  courseCount: string
  courseAmount: string
  deductionAmount: string
  tipAmount: string
  finalAmount: string
  status: string
  rate: string
  groupName: string
  remark: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface SalaryDetailResp {
  id: string
  teacherId: string
  teacherName: string
  startDate: string
  endDate: string
  courseCount: string
  courseAmount: string
  deductionAmount: string
  tipAmount: string
  finalAmount: string
  status: string
  rate: string
  groupName: string
  remark: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}
export interface SalaryQuery {
  teacherName: string | undefined
  startDate: string | undefined
  endDate: string | undefined
  status: string | undefined
  groupName: string | undefined
  sort: Array<string>
}
export interface SalaryPageQuery extends SalaryQuery, PageQuery {}

/** @desc 查询薪资列表 */
export function listSalary(query: SalaryPageQuery) {
  return http.get<PageRes<SalaryResp[]>>(BASE_URL, query)
}

/** @desc 查询薪资详情 */
export function getSalary(id: string) {
  return http.get<SalaryDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增薪资 */
export function addSalary(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改薪资 */
export function updateSalary(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除薪资 */
export function deleteSalary(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出薪资 */
export function exportSalary(query: SalaryQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 更新薪资状态 */
export function updateSalaryStatus(id: string, status: string) {
  return http.put(`${BASE_URL}/${id}`, { status })
}
