<template>
  <a-spin :loading="loading" style="width: 100%">
    <a-card
      class="general-card"
      :style="{
        background: isDark
          ? 'linear-gradient(180deg, #284991 0%, #122B62 100%)'
          : 'linear-gradient(180deg, #f2f9fe 0%, #e6f4fe 100%)',
      }"
    >
      <div class="content-wrap">
        <div class="content">
          <a-statistic
            title="本周约课"
            :value="count"
            :value-from="0"
            animation
            show-group-separator
          />
          <div class="desc">
            <a-typography-text type="secondary" class="label">较上周</a-typography-text>
            <a-typography-text v-if="growth > 0" type="success" :title="`${growth}%`">
              {{ growth }}%
              <icon-arrow-rise />
            </a-typography-text>
            <a-typography-text v-else-if="growth < 0" type="danger" :title="`${growth}%`">
              {{ growth }}%
              <icon-arrow-fall />
            </a-typography-text>
            <a-typography-text v-else type="secondary" :title="'0%'">
              0%
            </a-typography-text>
          </div>
        </div>
        <div class="chart">
          <Chart v-if="!loading" :option="chartOption" />
        </div>
      </div>
    </a-card>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChart } from '@/hooks'
import { useAppStore } from '@/stores'
import { getOverviewWeeklyCourse } from '@/apis/common'

const appStore = useAppStore()
const isDark = computed(() => appStore.theme === 'dark')

const count = ref(0)
const growth = ref(0)
const xAxis = ref<string[]>([])
const chartData = ref<number[]>([])
const { chartOption } = useChart(() => {
  return {
    grid: {
      left: 0,
      right: 30,
      top: 10,
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: xAxis.value,
      show: false,
    },
    yAxis: {
      show: false,
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      formatter: (params: any) => {
        const item = params[0]
        return `${item.name}<br/>${item.seriesName}: ${item.value}`
      },
    },
    series: [
      {
        name: '约课数',
        data: chartData.value,
        type: 'line',
        showSymbol: false,
        smooth: true,
        lineStyle: {
          color: '#246EFF',
          width: 2,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(36, 110, 255, 0.3)' },
              { offset: 1, color: 'rgba(36, 110, 255, 0)' },
            ],
          },
        },
      },
    ],
  }
})

const loading = ref(false)

// 查询图表数据
const getChartData = async () => {
  try {
    loading.value = true
    const { data } = await getOverviewWeeklyCourse()
    
    // 本周约课数
    count.value = data.today || 0
    // 较上周增长
    growth.value = data.growth || 0
    
    // 简单的图表数据（最近7天的趋势）
    // 根据增长率生成模拟趋势数据
    const thisWeek = data.today || 0
    const growthRate = data.growth || 0
    const lastWeek = growthRate !== 0 ? Math.round(thisWeek / (1 + growthRate / 100)) : thisWeek
    const diff = thisWeek - lastWeek
    const step = diff / 6
    
    xAxis.value = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    chartData.value = Array.from({ length: 7 }, (_, i) => 
      Math.max(0, Math.round(lastWeek + step * i))
    )
  } catch (error) {
    console.error('获取每周约课数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getChartData()
})
</script>

<style scoped lang="less">
:deep(.arco-card) {
  border-radius: 4px;
}
:deep(.arco-card-body) {
  width: 100%;
  height: 134px;
  padding: 0;
}
.content-wrap {
  width: 100%;
  padding: 16px;
  white-space: nowrap;
}
:deep(.content) {
  float: left;
  width: 108px;
  height: 102px;
}
:deep(.arco-statistic) {
  .arco-statistic-title {
    font-size: 16px;
    font-weight: bold;
    white-space: nowrap;
  }
  .arco-statistic-content {
    margin-top: 10px;
  }
}

.chart {
  float: right;
  width: calc(100% - 108px);
  height: 90px;
  vertical-align: bottom;
}

.label {
  padding-right: 8px;
  font-size: 12px;
}

.desc {
  margin-top: 8px;
}
</style>
