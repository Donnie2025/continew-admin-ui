import http from '@/utils/http'

const BASE_URL = '/education/card'

export interface CardResp {
  id: string
  name: string
  type: string
  availableCount: string
  availableDay: string
  availableBalance: string
  price: string
  isAgentOnly: string
  isOnlineSale: string
  isRenewable: string
  renewTimes: string
  renewDays: string
  renewPrice: string
  status: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface CardDetailResp {
  id: string
  name: string
  type: string
  availableCount: string
  availableDay: string
  availableBalance: string
  price: string
  isAgentOnly: string
  isOnlineSale: string
  isRenewable: string
  renewTimes: string
  renewDays: string
  renewPrice: string
  status: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}
export interface CardQuery {
  name: string | undefined
  sort: Array<string>
}
export interface CardPageQuery extends CardQuery, PageQuery {}

/** @desc 查询会员卡管理列表 */
export function listCard(query: CardPageQuery) {
  return http.get<PageRes<CardResp[]>>(BASE_URL, query)
}

/** @desc 查询会员卡管理详情 */
export function getCard(id: string) {
  return http.get<CardDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 查询所有状态为1的会员卡 */
export function listActiveCards() {
  return http.get<CardResp[]>(`${BASE_URL}/active`)
}

/** @desc 创建会员卡管理 */
export function createCard(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 更新会员卡管理 */
export function updateCard(id: string, data: any) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除会员卡管理 */
export function deleteCard(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出会员卡管理 */
export function exportCard(query: CardQuery) {
  return http.download(`${BASE_URL}/export`, query)
}
