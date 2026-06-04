import http from '@/utils/http'

const BASE_URL = '/agent/course'

// 复用education的Course类型定义
export interface CourseResp {
  id: string
  name: string
  agentCode?: string
  mainTeacherId: string
  mainTeacherName?: string
  mainTeacherUid: string
  courseUid: string
  courseSettingId: string
  institutionId: string
  institutionName?: string
  materialId?: string
  materialName?: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
  teachers?: CourseTeacherResp[]
  students?: CourseStudentResp[]
  teacherCount?: number
  studentCount?: number
}

export interface CourseDetailResp {
  id: string
  name: string
  agentCode?: string
  mainTeacherId: string
  mainTeacherUid: string
  courseUnique: string
  courseUid: string
  courseSettingId: string
  status: string
  institutionId: string
  createTime: string
  updateTime: string
  createUser: string
  updateUser: string
  createUserString: string
  updateUserString: string
  teachers?: CourseTeacherResp[]
  students?: CourseStudentResp[]
}

export interface CourseTeacherResp {
  id: string
  courseId: string
  courseName: string
  teacherId: string
  teacherName: string
  teacherUid: string
  teacherPhone?: string
  teacherEmail?: string
  status: number
}

export interface CourseStudentResp {
  id: string
  courseId: string
  courseName: string
  studentId: string
  studentName: string
  studentUid: string
  studentPhone?: string
  studentEmail?: string
  status: number
}

export interface CourseTeacherReq {
  courseId: string
  teacherIds: string[]
}

export interface CourseStudentReq {
  courseId: string
  studentIds: string[]
}

export interface CourseQuery {
  name?: string
  agentCode?: string
  mainTeacherId?: string
  institutionId?: string
  sort?: string[]
}

export interface CourseReq {
  name: string
  agentCode?: string
  mainTeacherId?: string
  courseSettingId?: string
  institutionId?: string
  remark?: string
}

/**
 * 分页查询小班课
 */
export function listCourse(query: CourseQuery) {
  return http.get(`${BASE_URL}/page`, query)
}

/**
 * 查询小班课详情
 */
export function getCourse(id: string) {
  return http.get<CourseDetailResp>(`${BASE_URL}/${id}`)
}

/**
 * 新增小班课
 */
export function createCourse(data: CourseReq) {
  return http.post(BASE_URL, data)
}

/**
 * 修改小班课
 */
export function updateCourse(data: CourseReq, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/**
 * 删除小班课
 */
export function deleteCourse(id: string) {
  return http.delete(`${BASE_URL}/${id}`)
}

/**
 * 导出小班课
 */
export function exportCourse(query: CourseQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/**
 * 为班级添加老师
 */
export function addTeachersToCourse(data: CourseTeacherReq) {
  return http.post(`${BASE_URL}/teacher`, data)
}

/**
 * 从班级移除老师
 */
export function removeTeacherFromCourse(courseId: string, teacherId: string) {
  return http.delete(`${BASE_URL}/teacher/${courseId}/${teacherId}`)
}

/**
 * 获取班级的老师列表
 */
export function listCourseTeachers(courseId: string) {
  return http.get<CourseTeacherResp[]>(`${BASE_URL}/teacher/${courseId}`)
}

/**
 * 为班级添加学生
 */
export function addStudentsToCourse(data: CourseStudentReq) {
  return http.post(`${BASE_URL}/student`, data)
}

/**
 * 从班级移除学生
 */
export function removeStudentFromCourse(courseId: string, studentId: string) {
  return http.delete(`${BASE_URL}/student/${courseId}/${studentId}`)
}

/**
 * 获取班级的学生列表
 */
export function listCourseStudents(courseId: string) {
  return http.get<CourseStudentResp[]>(`${BASE_URL}/student/${courseId}`)
}

/**
 * 获取班级的课节列表
 */
export function listCourseLessons(courseId: string) {
  return http.get(`${BASE_URL}/lesson/${courseId}`)
}

/**
 * 设置班级关联教材
 */
export function setCourseMaterial(courseId: string, materialId: string | null, materialName: string | null) {
  const qs = new URLSearchParams()
  if (materialId != null) qs.set('materialId', String(materialId))
  if (materialName != null) qs.set('materialName', materialName)
  return http.put(`${BASE_URL}/${courseId}/material?${qs.toString()}`, {})
}
