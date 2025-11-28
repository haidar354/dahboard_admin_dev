<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminSubscriptionStore, useAdminPlanStore } from '@/stores/admin/billingStore'

definePage({
  meta: {
    name: 'Admin Subscriptions',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const subscriptionStore = useAdminSubscriptionStore()
const planStore = useAdminPlanStore()
const { paginateData, isLoading, requestQuery, additionalFilter, isLoadingAction } = storeToRefs(subscriptionStore)
const { plans } = storeToRefs(planStore)

const search = ref('')
const cancelDialogVisible = ref(false)
const cancelReason = ref('')
const subscriptionToCancel = ref<string | null>(null)

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Company', key: 'companyName', sortable: true },
  { title: 'Plan', key: 'planName', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Periode', key: 'period', sortable: false },
  { title: 'Auto Renew', key: 'autoRenew', sortable: false },
  { title: 'Harga', key: 'price', sortable: false },
  { title: 'Aksi', key: 'actions', width: '100px', sortable: false },
]

watch(search, customDebounce((val: string) => {
  requestQuery.value.search = val
  requestQuery.value.page = 1
}, 500))

watch([requestQuery, additionalFilter], async () => {
  await subscriptionStore.fetchSubscriptions()
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    subscriptionStore.fetchSubscriptions(),
    planStore.fetchPlans(),
  ])
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    trial: 'warning',
    expired: 'error',
    cancelled: 'secondary',
    pending: 'info',
  }
  return colors[status] || 'secondary'
}

const openCancelDialog = (subscriptionId: string) => {
  subscriptionToCancel.value = subscriptionId
  cancelDialogVisible.value = true
}

const handleCancel = async () => {
  if (subscriptionToCancel.value && cancelReason.value) {
    await subscriptionStore.cancelSubscription(subscriptionToCancel.value, cancelReason.value)
    cancelDialogVisible.value = false
    cancelReason.value = ''
    subscriptionToCancel.value = null
  }
}
</script>

<template>
  <div data-testid="admin-subscriptions-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Subscription</h5>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari subscription..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="3">
            <AppSelect
              v-model="additionalFilter.status"
              label="Status"
              :items="[
                { title: 'Semua', value: '' },
                { title: 'Active', value: 'active' },
                { title: 'Trial', value: 'trial' },
                { title: 'Expired', value: 'expired' },
                { title: 'Cancelled', value: 'cancelled' },
              ]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="3">
            <AppSelect
              v-model="additionalFilter.planId"
              label="Plan"
              :items="[{ title: 'Semua', value: '' }, ...plans.map(p => ({ title: p.name, value: p.id }))]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2" class="d-flex align-center">
            <VBtn variant="outlined" @click="subscriptionStore.resetFilter()">Reset</VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDataTable
        :headers="headers"
        :items="paginateData.data"
        :loading="isLoading"
        :items-per-page="requestQuery.perPage"
        class="text-no-wrap"
      >
        <template #item.index="{ index }">
          {{ (requestQuery.page! - 1) * requestQuery.perPage! + index + 1 }}
        </template>

        <template #item.companyName="{ item }">
          <span class="font-weight-medium">{{ item.companyName }}</span>
        </template>

        <template #item.planName="{ item }">
          <VChip size="small" color="primary" variant="tonal">
            {{ item.planName }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="getStatusColor(item.status)">
            {{ item.status }}
          </VChip>
        </template>

        <template #item.period="{ item }">
          <div class="text-body-2">
            {{ dayjs(item.startDate).format('DD/MM/YYYY') }} - {{ dayjs(item.endDate).format('DD/MM/YYYY') }}
          </div>
          <div v-if="item.trialEndDate" class="text-caption text-warning">
            Trial ends: {{ dayjs(item.trialEndDate).format('DD/MM/YYYY') }}
          </div>
        </template>

        <template #item.autoRenew="{ item }">
          <VIcon
            :icon="item.autoRenew ? 'tabler-check' : 'tabler-x'"
            :color="item.autoRenew ? 'success' : 'error'"
          />
        </template>

        <template #item.price="{ item }">
          {{ formatCurrency(item.price) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              v-if="item.status === 'active' || item.status === 'trial'"
              size="small"
              @click="openCancelDialog(item.id)"
            >
              <VIcon icon="tabler-x" color="error" />
              <VTooltip activator="parent">Cancel</VTooltip>
            </IconBtn>
          </div>
        </template>

        <template #bottom>
          <VCardText class="pt-2">
            <div class="d-flex justify-end">
              <VPagination
                v-model="requestQuery.page"
                :length="paginateData.meta?.lastPage || 1"
                :total-visible="5"
              />
            </div>
          </VCardText>
        </template>
      </VDataTable>
    </VCard>

    <!-- Cancel Dialog -->
    <VDialog v-model="cancelDialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Cancel Subscription</VCardTitle>
        <VCardText>
          <p class="mb-4">Masukkan alasan pembatalan:</p>
          <AppTextarea
            v-model="cancelReason"
            label="Alasan"
            placeholder="Contoh: Permintaan customer"
            rows="3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="cancelDialogVisible = false">Batal</VBtn>
          <VBtn color="error" :loading="isLoadingAction" :disabled="!cancelReason" @click="handleCancel">
            Cancel Subscription
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
