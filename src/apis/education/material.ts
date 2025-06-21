import http from '@/utils/http'

const BASE_URL = '/education/material'

/**
 * 获取教材列表
 */
export function listMaterials() {
  return http.get(`${BASE_URL}/list`)
}

/**
 * 获取教材详情
 * @param id 教材ID
 */
export function getMaterial(id: string) {
  return http.get(`${BASE_URL}/${id}`)
}

/**
 * 添加教材
 * @param data 教材数据
 */
export function addMaterial(data: any) {
  return http.post(BASE_URL, data)
}

/**
 * 更新教材
 * @param id 教材ID
 * @param data 教材数据
 */
export function updateMaterial(id: string, data: any) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/**
 * 删除教材
 * @param id 教材ID
 */
export function deleteMaterial(id: string) {
  return http.del(BASE_URL, { ids: [id] })
} 