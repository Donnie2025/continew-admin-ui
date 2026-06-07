import http from '@/utils/http'

const BASE_URL = '/education/feishu'

/**
 * 创建飞书文件夹
 *
 * @param parentFolderToken 父文件夹token（null表示根目录）
 * @param folderName 文件夹名称
 * @returns 文件夹token
 */
export function createFeishuFolder(parentFolderToken: string | null, folderName: string) {
  return http.post<string>(`${BASE_URL}/folder`, null, {
    params: {
      parentFolderToken: parentFolderToken || '',
      folderName
    }
  })
}

/**
 * 查找飞书子文件夹
 *
 * @param parentFolderToken 父文件夹token
 * @param folderName 文件夹名称
 * @returns 如果存在返回文件夹token，否则返回null
 */
export function findFeishuSubFolder(parentFolderToken: string, folderName: string) {
  return http.get<string | null>(`${BASE_URL}/folder/find`, {
    params: {
      parentFolderToken,
      folderName
    }
  })
}

/**
 * 上传文件到飞书
 *
 * @param folderToken 目标文件夹token
 * @param file 文件
 * @returns 文件token和分享链接
 */
export function uploadFeishuFile(folderToken: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folderToken', folderToken)
  return http.post<{ fileToken: string; lessonUrl: string }>(`${BASE_URL}/file/upload`, formData)
}

/**
 * 重命名飞书文件
 *
 * @param fileToken 文件token
 * @param newName 新文件名
 * @returns 是否成功
 */
export function renameFeishuFile(fileToken: string, newName: string) {
  return http.put<boolean>(`${BASE_URL}/file/${fileToken}/rename`, null, {
    params: { newName }
  })
}
