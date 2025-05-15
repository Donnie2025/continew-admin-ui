import http from '@/utils/http'

const BASE_URL = '/education/stuCard'

export interface StuCardResp {
  id: string
  stuId: string
  stuName: string
  cardId: string
  cardName: string
  cardType: string
  balance: string
  expireDate: string
  cardStatus: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface StuCardDetailResp {
  id: string
  stuId: string
  stuName: string
  cardId: string
  cardName: string
  cardType: string
  balance: string
  expireDate: string
  status: string
  cardStatus: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
}
export interface StuCardQuery {
  sort: Array<string>
}
export interface StuCardPageQuery extends StuCardQuery, PageQuery {}

/** @desc 查询会员绑卡列表 */
export function listStuCard(query: StuCardPageQuery) {
  return http.get<PageRes<StuCardResp[]>>(BASE_URL, query)
}

/** @desc 查询会员绑卡详情 */
export function getStuCard(id: string) {
  return http.get<StuCardDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增会员绑卡 */
export function addStuCard(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改会员绑卡 */
export function updateStuCard(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除会员绑卡 */
export function deleteStuCard(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出会员绑卡 */
export function exportStuCard(query: StuCardQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 绑定会员卡 */
export function bindStuCard(data: any) {
  return http.post(`${BASE_URL}/bind`, data)
}
