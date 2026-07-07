import http from '@/utils/http'

const BASE_URL = '/api/education/payment-channel'

export interface PaymentChannelResp {
  id: number
  channelCode: string
  channelName: string
  paymentType: string
  qrcodeImage: string
  description: string
  sort: number
  status: number
}

/** @desc 查询可用支付渠道列表 */
export function listActiveChannels() {
  return http.get<PaymentChannelResp[]>(`${BASE_URL}/active`)
}
