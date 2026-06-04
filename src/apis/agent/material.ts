import http from '@/utils/http'

const BASE_URL = '/agent/material'

export interface AgentMaterialResp {
  id: string
  pid: string
  type: string
  name: string
  code: string
  coverImg: string
  description: string
  lessonUrl: string
  cloudId: string
  cloudName: string
  isShow: boolean
  sort: number
  status: number
  updateUser: string
  updateTime: string
}

export interface AgentMaterialReq {
  pid?: number | null
  type: string
  name: string
  code?: string
  description?: string
  lessonUrl?: string
  isShow?: boolean
  sort?: number
  status?: number
}

/** @desc 获取全量机构教材节点（不分页，用于构建树） */
export function listAllAgentMaterials() {
  return http.get<AgentMaterialResp[]>(`${BASE_URL}/list-all`)
}

/** @desc 查询机构教材节点详情 */
export function getAgentMaterial(id: string) {
  return http.get<AgentMaterialResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增机构教材节点 */
export function addAgentMaterial(data: AgentMaterialReq) {
  return http.post<{ id: string }>(BASE_URL, data)
}

/** @desc 修改机构教材节点 */
export function updateAgentMaterial(data: AgentMaterialReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除机构教材节点（批量） */
export function deleteAgentMaterials(ids: string[]) {
  return http.del(BASE_URL, { ids })
}
