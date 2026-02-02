import http from '@/utils/http'

const BASE_URL = '/member'

/**
 * 搜索会员
 * @param keyword 关键字（姓名或手机号）
 * @param limit 限制返回数量，默认为20
 */
export function searchMembers(keyword: string, limit: number = 20) {
  return http.get(`/education/student/search`, { 
    keyword, 
    limit, 
    // 添加当前时间戳，避免缓存
    _t: new Date().getTime() 
  })
}

/**
 * 获取会员卡列表
 * @param memberId 会员ID
 * @param teacherId 教师ID，用于筛选可用于该教师的会员卡
 */
export function getMemberCards(memberId: number | string, teacherId?: number | string) {
  // 确保 stuId 是数字类型
  const stuId = typeof memberId === 'string' ? parseInt(memberId, 10) : memberId;
  // 确保 teacherId 也是数字类型（如果提供）
  const teacherIdNum = teacherId ? (typeof teacherId === 'string' ? parseInt(teacherId, 10) : teacherId) : undefined;
  
  return http.get(`/api/education/stuCard/available`, { 
    stuId, 
    teacherId: teacherIdNum 
  });
}

/**
 * 获取会员详情
 * @param id 会员ID
 */
export function getMember(id: string) {
  return http.get(`${BASE_URL}/${id}`)
}

/**
 * 获取会员列表
 * @param params 查询参数
 */
export function listMembers(params: any) {
  return http.get(`${BASE_URL}/list`, params)
} 