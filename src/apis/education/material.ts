import http from '@/utils/http'

const BASE_URL = '/education/material'

export interface MaterialResp {
  id: string
  code: string
  name: string
  level: string
  category: string
  coverImg: string
  desc: string
  isShow: string
  sort: string
  status: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface MaterialDetailResp {
  id: string
  code: string
  name: string
  level: string
  category: string
  coverImg: string
  desc: string
  isShow: string
  sort: string
  status: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  createUserString: string
  updateUserString: string
}
export interface MaterialQuery {
  code: string | undefined
  name: string | undefined
  level: string | undefined
  category: string | undefined
  isShow: string | undefined
  sort: string | undefined
  status: string | undefined
  createUser: string | undefined
  createTime: string | undefined
  sort: Array<string>
}
export interface MaterialPageQuery extends MaterialQuery, PageQuery {}

/** @desc 查询教材列表 */
export function listMaterial(query: MaterialPageQuery) {
  return http.get<PageRes<MaterialResp[]>>(BASE_URL, query)
}

/** @desc 查询教材详情 */
export function getMaterial(id: string) {
  return http.get<MaterialDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增教材 */
export function addMaterial(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改教材 */
export function updateMaterial(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除教材 */
export function deleteMaterial(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出教材 */
export function exportMaterial(query: MaterialQuery) {
  return http.download(`${BASE_URL}/export`, query)
}
