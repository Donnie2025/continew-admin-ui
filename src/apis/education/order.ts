import http from '@/utils/http'

const BASE_URL = '/api/education/order'

export interface OrderResp {
  id: string
  orderNo: string
  studentId: string
  studentName: string
  cardId: string
  cardTitle: string
  cardType: string
  orderPrice: string
  paymentType: string
  paymentChannelName: string
  paymentMethod: string
  orderStatus: string
  stuCardId: string
  remark: string
  institutionId: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface OrderDetailResp {
  id: string
  orderNo: string
  studentId: string
  studentName: string
  cardId: string
  cardTitle: string
  cardType: string
  orderPrice: string
  paymentType: string
  paymentChannelName: string
  paymentMethod: string
  orderStatus: string
  stuCardId: string
  paymentTime: string
  confirmTime: string
  remark: string
  institutionId: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}
export interface OrderQuery {
  orderNo: string | undefined
  studentName: string | undefined
  cardId: string | undefined
  cardTitle: string | undefined
  cardType: string | undefined
  paymentType: string | undefined
  paymentMethod: string | undefined
  orderStatus: string | undefined
  createUser: string | undefined
  sort: Array<string>
}
export interface OrderPageQuery extends OrderQuery, PageQuery {}

/** @desc 查询订单列表 */
export function listOrder(query: OrderPageQuery) {
  return http.get<PageRes<OrderResp[]>>(BASE_URL, query)
}

/** @desc 查询订单详情 */
export function getOrder(id: string) {
  return http.get<OrderDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增订单 */
export function addOrder(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 创建订单 */
export function createOrder(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改订单 */
export function updateOrder(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除订单 */
export function deleteOrder(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出订单 */
export function exportOrder(query: OrderQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 确认订单入账 */
export function confirmOrder(id: string) {
  return http.put(`${BASE_URL}/${id}/confirm`)
}
