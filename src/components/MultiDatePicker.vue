<template>
  <div class="datepicker-container">
    <div class="selected-dates" v-if="displayDates.length > 0">
      <div v-for="(date, index) in displayDates" :key="index" class="date-tag">
        {{ formatDate(date) }}
        <span class="remove-date" @click.stop="removeDate(index)">×</span>
      </div>
      <div class="clear-all" @click="clearAll">清空</div>
    </div>
    <a-date-picker
      v-model:value="selectedDates"
      style="width: 280px;"
      multiple
      :allowClear="true"
      :format="dateFormat"
      :placeholder="placeholder"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect, computed } from 'vue'
import dayjs from 'dayjs'

// 定义props和emits
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: '请选择日期'
  },
  dateFormat: {
    type: String,
    default: 'YYYY-MM-DD'
  }
})

const emits = defineEmits(['update:modelValue'])

// 已选择的日期数组
const selectedDates = ref<any[]>([])

// 单向同步：从props到内部状态
watchEffect(() => {
  if (Array.isArray(props.modelValue)) {
    selectedDates.value = props.modelValue.map(date => {
      // 如果是字符串，转换为dayjs对象
      if (typeof date === 'string') {
        return dayjs(date);
      }
      return date;
    });
  } else {
    selectedDates.value = [];
  }
});

// 显示的日期，用于UI展示
const displayDates = computed(() => {
  return selectedDates.value.map(date => {
    if (typeof date === 'string') {
      return dayjs(date);
    }
    return date;
  });
});

// 格式化日期为显示格式
const formatDate = (date: any) => {
  if (!date) return '';
  if (typeof date === 'string') {
    return date;
  }
  if (date && typeof date.format === 'function') {
    return date.format('YYYY-MM-DD');
  }
  return dayjs(date).format('YYYY-MM-DD');
};

// 处理日期选择
const handleChange = (dates: any[]) => {
  if (!dates) {
    console.log('日期选择器值为空');
    emits('update:modelValue', []);
    return;
  }
  
  console.log('MultiDatePicker 选择的日期:', dates);
  
  // 确保dates是一个数组
  const dateArray = Array.isArray(dates) ? dates : [dates];
  
  // 对日期进行格式化并发送给父组件
  const formattedDates = dateArray.map(date => {
    if (typeof date === 'string') {
      return date;
    }
    if (date && typeof date.format === 'function') {
      return date.format('YYYY-MM-DD');
    }
    return date;
  });
  
  console.log('MultiDatePicker 格式化后的日期:', formattedDates);
  emits('update:modelValue', formattedDates);
};

// 移除单个日期
const removeDate = (index: number) => {
  const newSelectedDates = [...selectedDates.value];
  newSelectedDates.splice(index, 1);
  selectedDates.value = newSelectedDates;
  emits('update:modelValue', newSelectedDates);
};

// 清空所有日期
const clearAll = () => {
  selectedDates.value = [];
  emits('update:modelValue', []);
};
</script>

<style scoped>
.datepicker-container {
  display: inline-block;
  width: 280px;
}

.selected-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
  max-width: 100%;
}

.date-tag {
  background-color: #f0f0f0;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.remove-date {
  margin-left: 4px;
  cursor: pointer;
  font-weight: bold;
}

.clear-all {
  color: #1677ff;
  cursor: pointer;
  font-size: 14px;
  margin-left: auto;
}
</style> 