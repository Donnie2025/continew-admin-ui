<template>
  <div class="gi_table_page">
    <GiTable
      title="教师管理"
      row-key="id"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :pagination="pagination"
      :disabled-tools="['size']"
      :disabled-column-keys="['name']"
      @refresh="search"
    >
      <template #toolbar-left>
	    <a-input-search v-model="queryForm.name" placeholder="请输入教师姓名" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.isShow" placeholder="请输入是否展示" allow-clear @search="search" />
	    <a-input-search v-model="queryForm.groupName" placeholder="请输入所属组" allow-clear @search="search" />
        <a-button @click="reset">
          <template #icon><icon-refresh /></template>
          <template #default>重置</template>
        </a-button>
      </template>
      <template #toolbar-right>
        <a-button v-permission="['education:teacher:create']" type="primary" @click="onAdd">
          <template #icon><icon-plus /></template>
          <template #default>新增</template>
        </a-button>
        <a-button v-permission="['education:teacher:export']" @click="onExport">
          <template #icon><icon-download /></template>
          <template #default>导出</template>
        </a-button>
      </template>
      <template #avatar="{ record }">
        <a-image
          v-if="record.avatar"
          :src="record.avatar"
          :preview="true"
          width="40"
          height="40"
          fit="cover"
          style="border-radius: 50%"
        />
        <a-avatar v-else :size="40">{{ record.name?.[0]?.toUpperCase() }}</a-avatar>
      </template>
      <template #gender="{ record }">
        <GiCellTag :value="record.gender" :dict="[{ label: '男', value: 'male' }, { label: '女', value: 'female' }]" />
      </template>
      <template #isShow="{ record }">
        <GiCellTag :value="record.isShow" :dict="is_show" />
      </template>
      <template #isFixed="{ record }">
        <GiCellTag :value="record.isFixed" :dict="is_fixed" />
      </template>
      <template #status="{ record }">
        <GiCellTag :value="record.status" :dict="status" />
      </template>
      <template #sort="{ record }">
        <a-tag :color="Number(record.sort) <= 10 ? 'green' : Number(record.sort) <= 100 ? 'blue' : 'gray'">
          {{ record.sort }}
        </a-tag>
      </template>
      <template #action="{ record }">
        <a-space>
          <a-link v-permission="['education:teacher:get']" title="详情" @click="onDetail(record)">详情</a-link>
          <a-link v-permission="['education:teacher:update']" title="修改" @click="onUpdate(record)">修改</a-link>
          <a-link v-permission="['education:teacher:update']" title="设置密码" @click="onSetPassword(record)">设置密码</a-link>
          <a-link v-permission="['education:teacher:update']" title="置顶" @click="onSetTop(record)">置顶</a-link>
          <a-link
            v-permission="['education:teacher:delete']"
            status="danger"
            :disabled="record.disabled"
            :title="record.disabled ? '不可删除' : '删除'"
            @click="onDelete(record)"
          >
            删除
          </a-link>
        </a-space>
      </template>
    </GiTable>

    <TeacherAddModal ref="TeacherAddModalRef" @save-success="search" />
    <TeacherDetailDrawer ref="TeacherDetailDrawerRef" />
    <TeacherSetPasswordModal ref="TeacherSetPasswordModalRef" @save-success="search" />
  </div>
</template>

<script setup lang="ts">
import type { TableInstance } from '@arco-design/web-vue'
import { Message } from '@arco-design/web-vue'
import TeacherAddModal from './TeacherAddModal.vue'
import TeacherDetailDrawer from './TeacherDetailDrawer.vue'
import TeacherSetPasswordModal from './TeacherSetPasswordModal.vue'
import { type TeacherResp, type TeacherQuery, deleteTeacher, exportTeacher, listTeacher, setTeacherPassword, setTeacherTop } from '@/apis/education/teacher'
import { useDownload, useTable } from '@/hooks'
import { useDict } from '@/hooks/app'
import { isMobile } from '@/utils'
import has from '@/utils/has'

defineOptions({ name: 'Teacher' })

const { is_show, is_fixed, status } = useDict('is_show', 'is_fixed', 'status')

const queryForm = reactive<TeacherQuery>({
  name: undefined,
  isShow: undefined,
  groupName: undefined
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
  handleDelete
} = useTable((page) => listTeacher({ ...queryForm, ...page }), { immediate: true })
const columns: TableInstance['columns'] = [
  { title: '头像', dataIndex: 'avatar', slotName: 'avatar', width: 60 },
  { title: '教师姓名', dataIndex: 'name', slotName: 'name', width: 120, fixed: !isMobile() ? 'left' : undefined },
  { title: '性别', dataIndex: 'gender', slotName: 'gender', width: 60 },
  { title: '手机号码', dataIndex: 'phone', slotName: 'phone', width: 120 },
  { title: '邮箱', dataIndex: 'email', slotName: 'email', width: 150 },
  { title: '所属组', dataIndex: 'groupName', slotName: 'groupName', width: 100 },
  { title: '收款人姓名', dataIndex: 'recvName', slotName: 'recvName', width: 100 },
  { title: '单价', dataIndex: 'rate', slotName: 'rate', width: 70 },
  { title: '评分', dataIndex: 'score', slotName: 'score', width: 60 },
  { title: '标签', dataIndex: 'tags', slotName: 'tags', width: 120 },
  { title: '是否展示', dataIndex: 'isShow', slotName: 'isShow', width: 80 },
  { title: '是否固定', dataIndex: 'isFixed', slotName: 'isFixed', width: 80 },
  { title: '排序', dataIndex: 'sort', slotName: 'sort', width: 60 },
  {
    title: '操作',
    dataIndex: 'action',
    slotName: 'action',
    width: 280,
    align: 'center',
    fixed: !isMobile() ? 'right' : undefined,
    show: has.hasPermOr(['education:teacher:get', 'education:teacher:update', 'education:teacher:delete'])
  }
]

// 重置
const reset = () => {
  queryForm.name = undefined
  queryForm.isShow = undefined
  queryForm.groupName = undefined
  search()
}

// 删除
const onDelete = (record: TeacherResp) => {
  return handleDelete(() => deleteTeacher(record.id), {
    content: `是否确定删除该条数据？`,
    showModal: true
  })
}

// 导出
const onExport = () => {
  useDownload(() => exportTeacher(queryForm))
}

const TeacherAddModalRef = ref<InstanceType<typeof TeacherAddModal>>()
// 新增
const onAdd = () => {
  TeacherAddModalRef.value?.onAdd()
}

// 修改
const onUpdate = (record: TeacherResp) => {
  TeacherAddModalRef.value?.onUpdate(record.id)
}

const TeacherDetailDrawerRef = ref<InstanceType<typeof TeacherDetailDrawer>>()
// 详情
const onDetail = (record: TeacherResp) => {
  TeacherDetailDrawerRef.value?.onOpen(record.id)
}

const TeacherSetPasswordModalRef = ref<InstanceType<typeof TeacherSetPasswordModal>>()
// 设置密码
const onSetPassword = (record: TeacherResp) => {
  TeacherSetPasswordModalRef.value?.onOpen(record.id.toString(), record.name)
}

// 置顶
const onSetTop = async (record: TeacherResp) => {
  try {
    await setTeacherTop(record.id)
    Message.success('置顶成功')
    search()
  } catch (error) {
    Message.error('置顶失败')
  }
}
</script>

<style scoped lang="scss"></style>
