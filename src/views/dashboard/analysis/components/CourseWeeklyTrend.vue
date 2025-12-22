<template>
  <a-spin :loading="loading" style="width: 100%">
    <a-card class="general-card" title="每周约课数量趋势">
      <template #extra>
        <a-radio-group v-model="weeks" type="button" size="small" @change="handleWeeksChange">
          <a-radio :value="8">最近8周</a-radio>
          <a-radio :value="12">最近12周</a-radio>
          <a-radio :value="24">最近24周</a-radio>
        </a-radio-group>
      </template>
      <Chart :option="chartOption" style="width: 100%; height: 370px" />
    </a-card>
  </a-spin>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { type EChartsOption, graphic } from 'echarts'
import { useChart } from '@/hooks'
import { type DashboardChartCommonResp, getCourseWeeklyTrend as getData } from '@/apis/common'

// 提示框
const tooltipItemsHtmlString = (items) => {
  return items
    .map(
      (el) => `<div class="content-panel">
        <p>
          <span style="background-color: ${el.color}" class="tooltip-item-icon"></span>
          <span>${el.seriesName}</span>
        </p>
        <span class="tooltip-value">
        ${el.value}
        </span>
      </div>`,
    )
    .join('')
}

const weeks = ref(12)
const xAxis = ref<string[]>([])
const chartData = ref<number[]>([])
const { chartOption } = useChart((isDark: boolean) => {
  return {
    grid: {
      left: '40',
      right: '20',
      top: '20',
      bottom: '60',
    },
    xAxis: {
      type: 'category',
      data: xAxis.value,
      boundaryGap: false,
      axisLabel: {
        color: '#4E5969',
        rotate: 45,
        formatter(value: string) {
          // 显示结束日期
          return value
        },
      },
      axisLine: {
        lineStyle: {
          color: isDark ? '#3f3f3f' : '#A9AEB8',
        },
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: '#86909C',
        },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      name: '约课数量',
      axisLabel: {
        formatter(value: any) {
          return `${value}`
        },
      },
      axisLine: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: isDark ? '#3F3F3F' : '#E5E8EF',
        },
      },
    },
    tooltip: {
      show: true,
      trigger: 'axis',
      formatter(params) {
        const [firstElement] = params
        return `<div>
            <p class="tooltip-title">结束日期: ${firstElement.axisValueLabel}</p>
            ${tooltipItemsHtmlString(params)}
          </div>`
      },
      className: 'echarts-tooltip-diy',
    },
    series: [
      {
        name: '约课数量',
        data: chartData.value,
        type: 'line',
        smooth: true,
        showSymbol: true,
        color: isDark ? '#3D72F6' : '#246EFF',
        symbol: 'circle',
        symbolSize: 8,
        emphasis: {
          focus: 'series',
          itemStyle: {
            borderWidth: 2,
            borderColor: '#E0E3FF',
          },
        },
        areaStyle: {
          opacity: 0.8,
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgba(17, 126, 255, 0.16)',
            },
            {
              offset: 1,
              color: 'rgba(17, 128, 255, 0)',
            },
          ]),
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
    xAxis.value = []
    chartData.value = []
    const { data } = await getData(weeks.value)
    data.forEach((item: DashboardChartCommonResp) => {
      xAxis.value.push(item.name)
      chartData.value.push(item.value)
    })
  } finally {
    loading.value = false
  }
}

// 切换周数
const handleWeeksChange = () => {
  getChartData()
}

onMounted(() => {
  getChartData()
})
</script>

<style scoped lang="scss">
:deep(.arco-card-body) {
  padding-bottom: 0;
}
</style>
