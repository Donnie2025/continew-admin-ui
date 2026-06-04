import http from '@/utils/http'

const BASE_URL = '/education/classin/cloud'

export interface CloudFolderItem {
  folder_id: string
  folder_name: string
  is_system_folder: number
}

export interface CloudFileItem {
  id: string
  file_name: string
  file_size: string
}

export interface CloudListResp {
  folder_list: CloudFolderItem[]
  file_list: CloudFileItem[]
}

/** @desc 获取机构云盘顶级文件夹ID */
export function getCloudTopFolderId() {
  return http.get<string>(`${BASE_URL}/top-folder-id`)
}

/** @desc 获取云盘文件夹内容列表 */
export function getCloudList(folderId?: string) {
  return http.get<CloudListResp>(`${BASE_URL}/list`, folderId ? { folderId } : {})
}

/** @desc 获取云盘所有文件夹列表 */
export function getCloudFolderList() {
  return http.get<CloudFolderItem[]>(`${BASE_URL}/folder-list`)
}

/** @desc 重命名云盘文件 */
export function renameCloudFile(fileId: string, fileName: string) {
  return http.put<void>(`${BASE_URL}/file/${fileId}/rename?fileName=${encodeURIComponent(fileName)}`)
}

/** @desc 重命名云盘文件夹 */
export function renameCloudFolder(folderId: string, folderName: string) {
  return http.put<void>(`${BASE_URL}/folder/${folderId}/rename?folderName=${encodeURIComponent(folderName)}`)
}

/** @desc 创建云盘文件夹 */
export function createCloudFolder(parentFolderId: string, folderName: string) {
  return http.post<string>(`${BASE_URL}/folder?parentFolderId=${encodeURIComponent(parentFolderId)}&folderName=${encodeURIComponent(folderName)}`)
}

/** @desc 上传文件到云盘指定文件夹 */
export function uploadCloudFile(folderId: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return http.post<string>(`${BASE_URL}/file/upload?folderId=${encodeURIComponent(folderId)}`, formData)
}
