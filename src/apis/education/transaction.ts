import http from '@/utils/http'

const BASE_URL = '/api/education/transaction'

export interface TransactionResp {
  id: string
  stuCardId: string
  stuId: string
  stuName: string
  cardId: string
  cardTitle: string
  type: string
  debitAmount: string
  creditAmount: string
  debitDays: number
  creditDays: number
  beforeAmount: string
  afterAmount: string
  actualAmount: string
  remark: string
  createTime: string
  operatorName: string
  createUserString: string
  updateUserString: string
}
export interface TransactionDetailResp {
  id: string
  stuCardId: string
  stuId: string
  stuName: string
  cardId: string
  cardTitle: string
  type: string
  debitAmount: string
  creditAmount: string
  debitDays: number
  creditDays: number
  beforeAmount: string
  afterAmount: string
  actualAmount: string
  remark: string
  createTime: string
  operatorId: string
  operatorName: string
  createUserString: string
  updateUserString: string
}
export interface TransactionQuery {
  studentId: string | undefined
  cardId: string | undefined
  type: string | undefined
  sort: Array<string>
}
export interface TransactionPageQuery extends TransactionQuery, PageQuery {}

/** @desc 查询订单列表 */
export function listTransaction(query: TransactionPageQuery) {
  return http.get<PageRes<TransactionResp[]>>(BASE_URL, query)
}

/** @desc 查询订单详情 */
export function getTransaction(id: string) {
  return http.get<TransactionDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增订单 */
export function addTransaction(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改订单 */
export function updateTransaction(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除订单 */
export function deleteTransaction(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出订单 */
export function exportTransaction(query: TransactionQuery) {
  return http.download(`${BASE_URL}/export`, query)
}
