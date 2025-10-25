<template>
  <a-drawer v-model:visible="visible" title="Salary Statement" :width="width >= 600 ? 600 : '100%'" :footer="false">
    <div class="salary-statement">
      <!-- Header -->
      <div class="statement-header">
        <div class="company-info">
          <h2 class="company-name">Salary Statement</h2>
          <p class="statement-period">Payment Period</p>
        </div>
      </div>

      <!-- Teacher Info -->
      <div class="info-section">
        <div class="info-row">
          <span class="info-label">Teacher Name:</span>
          <span class="info-value teacher-name">{{ dataDetail?.teacherName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Period:</span>
          <span class="info-value">{{ dataDetail?.startDate }} ~ {{ dataDetail?.endDate }}</span>
        </div>
      </div>

      <!-- Salary Breakdown -->
      <div class="breakdown-section">
        <h3 class="section-title">Salary Breakdown</h3>
        
        <div class="breakdown-item">
          <div class="item-row">
            <span class="item-label">Course Count</span>
            <span class="item-value">{{ dataDetail?.courseCount }}</span>
          </div>
        </div>

        <div class="breakdown-item">
          <div class="item-row">
            <span class="item-label">Course Amount</span>
            <span class="item-value amount">₱{{ formatAmount(dataDetail?.courseAmount) }}</span>
          </div>
        </div>

        <div class="breakdown-item deduction">
          <div class="item-row">
            <span class="item-label">Deduction Amount</span>
            <span class="item-value amount deduction-amount">- ₱{{ formatAmount(dataDetail?.deductionAmount) }}</span>
          </div>
        </div>

        <div class="breakdown-item tip">
          <div class="item-row">
            <span class="item-label">Tip Amount</span>
            <span class="item-value amount tip-amount">+ ₱{{ formatAmount(dataDetail?.tipAmount) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="breakdown-item total">
          <div class="item-row">
            <span class="item-label">Final Payment</span>
            <span class="item-value final-amount">₱{{ formatAmount(dataDetail?.finalAmount) }}</span>
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div class="statement-footer">
        <p class="footer-note">This is an official salary statement. Please keep it for your records.</p>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { useWindowSize } from '@vueuse/core'
import { type SalaryDetailResp, getSalary as getDetail } from '@/apis/education/salary'

const { width } = useWindowSize()

const dataId = ref('')
const dataDetail = ref<SalaryDetailResp>()
const visible = ref(false)

// 格式化金额
const formatAmount = (amount: number | undefined) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 查询详情
const getDataDetail = async () => {
  const { data } = await getDetail(dataId.value)
  dataDetail.value = data
}

// 打开
const onOpen = async (id: string) => {
  dataId.value = id
  await getDataDetail()
  visible.value = true
}

defineExpose({ onOpen })
</script>

<style scoped lang="scss">
.salary-statement {
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%);
  border-radius: 8px;
  min-height: calc(100vh - 100px);
}

// Header Section
.statement-header {
  text-align: center;
  padding: 30px 20px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  .company-name {
    font-size: 28px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 8px 0;
    letter-spacing: 0.5px;
  }

  .statement-period {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-weight: 500;
  }
}

// Info Section
.info-section {
  background: #ffffff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    &:first-child {
      padding-top: 0;
    }

    .info-label {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    .info-value {
      font-size: 15px;
      color: #333;
      font-weight: 600;

      &.teacher-name {
        color: #667eea;
        font-size: 16px;
      }
    }
  }
}

// Breakdown Section
.breakdown-section {
  background: #ffffff;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;

  .section-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 2px solid #667eea;
  }

  .breakdown-item {
    padding: 12px 0;

    &.deduction {
      .deduction-amount {
        color: #ff4757;
      }
    }

    &.tip {
      .tip-amount {
        color: #2ed573;
      }
    }

    &.total {
      padding: 20px 0 0 0;

      .item-row {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

        .item-label {
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
        }

        .final-amount {
          color: #ffffff;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
      }
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .item-label {
        font-size: 14px;
        color: #666;
        font-weight: 500;
      }

      .item-value {
        font-size: 15px;
        color: #333;
        font-weight: 600;

        &.amount {
          font-size: 16px;
          font-weight: 700;
        }
      }
    }
  }

  .divider {
    height: 2px;
    background: linear-gradient(to right, transparent, #e8e8e8, transparent);
    margin: 20px 0;
  }
}

// Footer Section
.statement-footer {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px dashed #d9d9d9;

  .footer-note {
    font-size: 12px;
    color: #999;
    margin: 0;
    font-style: italic;
    line-height: 1.6;
  }
}

// Responsive
@media (max-width: 600px) {
  .salary-statement {
    padding: 12px;
  }

  .statement-header {
    padding: 20px 16px 16px;

    .company-name {
      font-size: 24px;
    }
  }

  .info-section,
  .breakdown-section {
    padding: 16px;
  }

  .breakdown-section {
    .breakdown-item.total {
      .item-row {
        padding: 14px 16px;

        .final-amount {
          font-size: 20px;
        }
      }
    }
  }
}
</style>
