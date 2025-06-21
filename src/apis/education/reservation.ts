import http from '@/utils/http'

const BASE_URL = '/education/booking'

/**
 * 创建预约
 * @param data 预约数据
 */
export function createReservation(data: any) {
  return http.post(`${BASE_URL}`, data)
}

/**
 * 取消预约
 * @param id 预约ID
 */
export function cancelReservation(id: string) {
  return http.post(`${BASE_URL}/cancel/${id}`)
}

/**
 * 获取预约详情
 * @param id 预约ID
 */
export function getReservation(id: string) {
  return http.get(`${BASE_URL}/${id}`)
}

/**
 * 获取预约列表
 * @param params 查询参数
 */
export function listReservations(params: any) {
  return http.get(`${BASE_URL}/list`, params)
} 