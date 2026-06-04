import http from '@/utils/http'

const BASE_URL = '/wechat/mpMenu'

export interface MpMenuButton {
  name: string
  type?: string
  key?: string
  url?: string
  appid?: string
  pagepath?: string
  mediaId?: string
  subButton?: MpMenuButton[]
}

export interface MpMenuReq {
  button: MpMenuButton[]
}

export interface MpMenuSubButtonItem {
  type?: string
  name: string
  key?: string
  url?: string
  appid?: string
  pagepath?: string
  media_id?: string
}

export interface MpMenuButtonResp {
  type?: string
  name: string
  key?: string
  url?: string
  appid?: string
  pagepath?: string
  media_id?: string
  sub_button?: { list: MpMenuButtonResp[] }
}

export interface MpMenuResp {
  menu?: {
    button: MpMenuButtonResp[]
    menuid?: number
  }
}

/** @desc 查询公众号当前菜单 */
export function getMpMenu() {
  return http.get<MpMenuResp>(BASE_URL)
}

/** @desc 创建/更新公众号菜单 */
export function saveMpMenu(data: MpMenuReq) {
  return http.post(BASE_URL, data)
}

/** @desc 删除公众号菜单 */
export function deleteMpMenu() {
  return http.del(BASE_URL)
}
