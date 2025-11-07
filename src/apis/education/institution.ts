import http from '@/utils/http'

const BASE_URL = '/education/institution'

export interface InstitutionResp {
  id: string
  code: string
  name: string
  sid: string
  status: number
}

/** @desc 查询所有启用的机构列表 */
export function listActiveInstitutions() {
  return http.get<InstitutionResp[]>(`${BASE_URL}/active`)
}

/** @desc 查询所有机构列表 */
export function listInstitutions() {
  return http.get<InstitutionResp[]>(`${BASE_URL}/list`)
}

