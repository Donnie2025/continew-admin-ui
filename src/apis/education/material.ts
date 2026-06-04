import http from '@/utils/http'

const BASE_URL = '/education/material'

export interface MaterialResp {
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
  pid: string
  type: string
  name: string
  code: string
  coverImg: string
  description: string
  lessonUrl: string
  cloudId: string
  cloudName: string
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
  pid: string | undefined
  type: string | undefined
  name: string | undefined
  code: string | undefined
  cloudId: string | undefined
  isShow: string | undefined
  status: number | undefined
  createUser: number | undefined
  createTime: string | undefined
}

export interface SyncCloudFolderItem {
  folderId: string
  folderName: string
}

export interface SyncCloudFileItem {
  fileId: string
  fileName: string
}

export interface SyncCloudFoldersReq {
  pid: number
  type: string
  skipExisting: boolean
  folders?: SyncCloudFolderItem[]
  files?: SyncCloudFileItem[]
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
  return http.post<{ id: string }>(BASE_URL, data)
}

/** @desc 修改教材 */
export function updateMaterial(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除教材 */
export function deleteMaterial(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 批量删除教材 */
export function deleteMaterials(ids: string[]) {
  return http.del(BASE_URL, { ids })
}

/** @desc 导出教材 */
export function exportMaterial(query: MaterialQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 获取所有教材列表（不分页） */
export function listAllMaterials() {
  return http.get<MaterialResp[]>(BASE_URL, { page: 1, size: 1000, status: 1 })
}

/** @desc 获取所有教材节点用于构建树（管理端，不过滤状态） */
export function listAllMaterialsForTree() {
  return http.get<MaterialResp[]>(`${BASE_URL}/list-all`)
}

/** @desc 同步云盘文件夹列表到教材表 */
export function syncCloudFolders(data: SyncCloudFoldersReq) {
  return http.post<number>(`${BASE_URL}/sync-cloud-folders`, data)
}

/** @desc 从ClassIn云盘同步数据到数据库（更新cloudName字段） */
export function syncCloudData(ids: string[]) {
  return http.post<number>(`${BASE_URL}/sync-cloud-data`, ids)
}
