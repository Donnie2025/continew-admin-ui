import http from '@/utils/http'

const BASE_URL = '/education/agent'

export interface AgentOption {
  code: string
  name: string
}

/** @desc 获取代理机构下拉选项 */
export function listAgentOptions() {
  return http.get<AgentOption[]>(`${BASE_URL}/options`)
}
