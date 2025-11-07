import http from '@/utils/http'

const BASE_URL = '/education/course'

export interface CourseResp {
  id: string
  name: string
  mainTeacherId: string
  mainTeacherName?: string
  mainTeacherUid: string
  courseUid: string
  courseSettingId: string
  institutionId: string
  institutionName?: string
  createTime: string
  createUserString: string
  updateUserString: string
  disabled: boolean
  teachers?: CourseTeacherResp[]
  students?: CourseStudentResp[]
}
export interface CourseDetailResp {
  id: string
  name: string
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
  name: string | undefined
  mainTeacherId: string | undefined
  institutionId: string | undefined
  sort: Array<string>
}
export interface CoursePageQuery extends CourseQuery, PageQuery {}

/** @desc 查询班级列表 */
export function listCourse(query: CoursePageQuery) {
  return http.get<PageRes<CourseResp[]>>(BASE_URL, query)
}

/** @desc 查询班级详情 */
export function getCourse(id: string) {
  return http.get<CourseDetailResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增班级 */
export function addCourse(data: any) {
  return http.post(BASE_URL, data)
}

/** @desc 修改班级 */
export function updateCourse(data: any, id: string) {
  return http.put(`${BASE_URL}/${id}`, data)
}

/** @desc 删除班级 */
export function deleteCourse(id: string) {
  return http.del(BASE_URL, { ids: [id] })
}

/** @desc 导出班级 */
export function exportCourse(query: CourseQuery) {
  return http.download(`${BASE_URL}/export`, query)
}

/** @desc 为班级添加老师 */
export function addTeachersToCourse(data: CourseTeacherReq) {
  return http.post(`${BASE_URL}/teacher`, data)
}

/** @desc 从班级移除老师 */
export function removeTeacherFromCourse(courseId: string, teacherId: string) {
  return http.del(`${BASE_URL}/teacher/${courseId}/${teacherId}`)
}

/** @desc 获取班级的老师列表 */
export function listCourseTeachers(courseId: string) {
  return http.get<CourseTeacherResp[]>(`${BASE_URL}/teacher/${courseId}`)
}

/** @desc 为班级添加学生 */
export function addStudentsToCourse(data: CourseStudentReq) {
  return http.post(`${BASE_URL}/student`, data)
}

/** @desc 从班级移除学生 */
export function removeStudentFromCourse(courseId: string, studentId: string) {
  return http.del(`${BASE_URL}/student/${courseId}/${studentId}`)
}

/** @desc 获取班级的学生列表 */
export function listCourseStudents(courseId: string) {
  return http.get<CourseStudentResp[]>(`${BASE_URL}/student/${courseId}`)
}
