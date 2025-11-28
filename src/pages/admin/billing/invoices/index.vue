<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminInvoiceStore } from '@/stores/admin/billingStore'

definePage({
  meta: {
    name: 'Admin Invoices',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const invoiceStore = useAdminInvoiceStore()
const { paginateData, isLoading, requestQuery, additionalFilter, isLoadingAction } = storeToRefs(invoiceStore)

const search = ref('')

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Invoice', key: 'invoiceNumber', sortable: true },
  { title: 'Company', key: 'companyName', sortable: true },
  { title: 'Plan', key: 'planName', sortable: false },
  { title: 'Total', key: 'total', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Jatuh Tempo', key: 'dueDate', sortable: true },
  { title: 'Dibayar', key: 'paidAt', sortable: false },
  { title: 'Aksi', key: 'actions', width: '100px', sortable: false },
]

watch(search, customDebounce((val: string) => {
  requestQuery.value.search = val
  requestQuery.value.page = 1
}, 500))

watch([requestQuery, additionalFilter], async () => {
  await invoiceStore.fetchInvoices()
}, { deep: true })

onMounted(async () => {
  await invoiceStore.fetchInvoices()
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
    draft: 'secondary',
    sent: 'info',
    paid: 'success',
    overdue: 'error',
    cancelled: 'secondary',
  }
  return colors[status] || 'secondary'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: 'Draft',
    sent: 'Terkirim',
    paid: 'Lunas',
    overdue: 'Terlambat',
    cancelled: 'Dibatalkan',
  }
  return texts[status] || status
}

const handleMarkPaid = async (invoiceId: string) => {
  await invoiceStore.markAsPaid(invoiceId)
}
</script>

<template>
  <div data-testid="admin-invoices-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Invoice</h5>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari invoice..."
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
                { title: 'Draft', value: 'draft' },
                { title: 'Terkirim', value: 'sent' },
                { title: 'Lunas', value: 'paid' },
                { title: 'Terlambat', value: 'overdue' },
              ]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2" class="d-flex align-center">
            <VBtn variant="outlined" @click="invoiceStore.resetFilter()">Reset</VBtn>
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

        <template #item.invoiceNumber="{ item }">
          <span class="font-weight-medium text-primary">{{ item.invoiceNumber }}</span>
        </template>

        <template #item.planName="{ item }">
          <VChip size="small" color="primary" variant="tonal">
            {{ item.planName }}
          </VChip>
        </template>

        <template #item.total="{ item }">
          <div>
            <div class="font-weight-medium">{{ formatCurrency(item.total) }}</div>
            <div class="text-caption text-disabled">incl. tax {{ formatCurrency(item.tax) }}</div>
          </div>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="getStatusColor(item.status)">
            {{ getStatusText(item.status) }}
          </VChip>
        </template>

        <template #item.dueDate="{ item }">
          {{ dayjs(item.dueDate).format('DD/MM/YYYY') }}
        </template>

        <template #item.paidAt="{ item }">
          {{ item.paidAt ? dayjs(item.paidAt).format('DD/MM/YYYY HH:mm') : '-' }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn
              v-if="item.status === 'sent' || item.status === 'overdue'"
              size="small"
              :loading="isLoadingAction"
              @click="handleMarkPaid(item.id)"
            >
              <VIcon icon="tabler-check" color="success" />
              <VTooltip activator="parent">Tandai Lunas</VTooltip>
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
  </div>
</template>
