import http from '@/utils/http'

const BASE_URL = '/education/materialLesson'

export interface MaterialLessonResp {
  id: string
  materialId: string
  materialName: string
  lessonName: string
  lessonUrl: string
  status: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
}
export interface MaterialLessonDetailResp {
  id: string
  materialId: string
  materialName: string
  lessonName: string
  lessonUrl: string
  status: string
  createUser: string
  createTime: string
  updateUser: string
  updateTime: string
  createUserString: string
  updateUserString: string
}
export interface MaterialLessonQuery {
  materialId: string | undefined
  materialName: string | undefined
  lessonName: string | undefined
  status: string | undefined
  createUser: string | undefined
  createTime: string | undefined
  sort: Array<string>
}
export interface MaterialLessonPageQuery extends MaterialLessonQuery, PageQuery {}

export interface MaterialLessonImportReq {
  materialId: string
  feishuUrl: string
  overwrite?: boolean
  remark?: string
}

export interface MaterialLessonImportResp {
  totalCount: number
  successCount: number
  failureCount: number
  skipCount: number
  successLessons: string[]
  failureLessons: Array<{
    lessonName: string
    reason: string
  }>
  skipLessons: string[]
}

/** @desc 查询课节列表 */
export function listMaterialLesson(query: MaterialLessonPageQuery) {
  return http.get<PageRes<MaterialLessonResp[]>>(BASE_URL, query)
}

/** @desc 查询课节详情 */
export function getMaterialLesson(id: string) {
  return http.get<MaterialLessonDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增课节 */
export function addMaterialLesson(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改课节 */
export function updateMaterialLesson(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除课节 */
export function deleteMaterialLesson(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 批量删除课节 */
export function batchDeleteMaterialLesson(ids: string[]) {
  return http.del(BASE_URL, { ids })
}

/** @desc 导出课节 */
export function exportMaterialLesson(query: MaterialLessonQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 从飞书链接导入课节 */
export function importMaterialLessonFromFeishu(data: MaterialLessonImportReq) {
  return http.post<MaterialLessonImportResp>(`${BASE_URL}/import`, data)
}

/** @desc 根据教材ID获取课节列表 */
export function listMaterialLessonsByMaterialId(materialId: string) {
  return http.get<MaterialLessonResp[]>(BASE_URL, { 
    materialId, 
    page: 1, 
    size: 1000,
    status: 1,
    sort: ['createTime,asc']
  })
}
