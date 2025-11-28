<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminCompanyStore } from '@/stores/admin/companyStore'
import { useAdminPlanStore } from '@/stores/admin/billingStore'

definePage({
  meta: {
    name: 'Admin Companies',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const companyStore = useAdminCompanyStore()
const planStore = useAdminPlanStore()
const { paginateData, isLoading, requestQuery, additionalFilter, isLoadingAction, suspendDialogVisible, suspendReason } = storeToRefs(companyStore)
const { plans } = storeToRefs(planStore)

const search = ref('')
const deleteDialogVisible = ref(false)
const companyToDelete = ref<string | null>(null)
const companyToSuspend = ref<string | null>(null)

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Company', key: 'name', sortable: true },
  { title: 'Plan', key: 'planName', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Subscription', key: 'subscriptionStatus', sortable: false },
  { title: 'Business Units', key: 'businessUnitsCount', sortable: false, align: 'center' },
  { title: 'Outlets', key: 'outletsCount', sortable: false, align: 'center' },
  { title: 'Users', key: 'usersCount', sortable: false, align: 'center' },
  { title: 'Aksi', key: 'actions', width: '150px', sortable: false },
]

watch(search, customDebounce((val: string) => {
  requestQuery.value.search = val
  requestQuery.value.page = 1
}, 500))

watch([requestQuery, additionalFilter], async () => {
  await companyStore.fetchCompanies()
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    companyStore.fetchCompanies(),
    planStore.fetchPlans(),
  ])
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    suspended: 'error',
    inactive: 'secondary',
  }
  return colors[status] || 'secondary'
}

const getSubscriptionColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    trial: 'warning',
    expired: 'error',
    cancelled: 'secondary',
  }
  return colors[status] || 'secondary'
}

const openSuspendDialog = (companyId: string) => {
  companyToSuspend.value = companyId
  suspendDialogVisible.value = true
}

const handleSuspend = async () => {
  if (companyToSuspend.value && suspendReason.value) {
    await companyStore.suspendCompany(companyToSuspend.value, suspendReason.value)
    companyToSuspend.value = null
  }
}

const handleResume = async (companyId: string) => {
  await companyStore.resumeCompany(companyId)
}

const confirmDelete = (companyId: string) => {
  companyToDelete.value = companyId
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (companyToDelete.value) {
    await companyStore.deleteCompany(companyToDelete.value)
    deleteDialogVisible.value = false
    companyToDelete.value = null
  }
}

const router = useRouter()
const viewCompany = (companyId: string) => {
  // Navigate to detail page
  router.push({ name: 'admin-tenant-companies-id', params: { id: companyId } })
}
</script>

<template>
  <div data-testid="admin-companies-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Company (Tenant)</h5>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari company..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="3">
            <AppSelect
              v-model="additionalFilter.status"
              label="Status"
              :items="[
                { title: 'Semua Status', value: '' },
                { title: 'Aktif', value: 'active' },
                { title: 'Suspended', value: 'suspended' },
                { title: 'Tidak Aktif', value: 'inactive' },
              ]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="3">
            <AppSelect
              v-model="additionalFilter.planId"
              label="Plan"
              :items="[{ title: 'Semua Plan', value: '' }, ...plans.map(p => ({ title: p.name, value: p.id }))]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2" class="d-flex align-center">
            <VBtn variant="outlined" color="secondary" @click="companyStore.resetFilter()">
              Reset
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDataTable
        :headers="headers"
        :items="paginateData.data"
        :loading="isLoading"
        :items-per-page="requestQuery.perPage"
        :items-length="paginateData.meta?.total || 0"
        class="text-no-wrap"
      >
        <template #item.index="{ index }">
          {{ (requestQuery.page! - 1) * requestQuery.perPage! + index + 1 }}
        </template>

        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.name }}</span>
            <span class="text-caption text-disabled">{{ item.code }} - {{ item.email }}</span>
          </div>
        </template>

        <template #item.planName="{ item }">
          <VChip size="small" color="primary" variant="tonal">
            {{ item.planName }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="getStatusColor(item.status)">
            {{ item.status === 'active' ? 'Aktif' : item.status === 'suspended' ? 'Suspended' : 'Tidak Aktif' }}
          </VChip>
        </template>

        <template #item.subscriptionStatus="{ item }">
          <VChip size="small" :color="getSubscriptionColor(item.subscriptionStatus)">
            {{ item.subscriptionStatus }}
          </VChip>
        </template>

        <template #item.businessUnitsCount="{ item }">
          <span class="text-center">{{ item.businessUnitsCount }}</span>
        </template>

        <template #item.outletsCount="{ item }">
          <span class="text-center">{{ item.outletsCount }}</span>
        </template>

        <template #item.usersCount="{ item }">
          <span class="text-center">{{ item.usersCount }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="viewCompany(item.id)">
              <VIcon icon="tabler-eye" color="info" />
            </IconBtn>
            <IconBtn
              v-if="item.status === 'active'"
              size="small"
              @click="openSuspendDialog(item.id)"
            >
              <VIcon icon="tabler-ban" color="warning" />
              <VTooltip activator="parent">Suspend</VTooltip>
            </IconBtn>
            <IconBtn
              v-if="item.status === 'suspended'"
              size="small"
              :loading="isLoadingAction"
              @click="handleResume(item.id)"
            >
              <VIcon icon="tabler-player-play" color="success" />
              <VTooltip activator="parent">Resume</VTooltip>
            </IconBtn>
            <IconBtn size="small" @click="confirmDelete(item.id)">
              <VIcon icon="tabler-trash" color="error" />
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

    <!-- Suspend Dialog -->
    <VDialog v-model="suspendDialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Suspend Company</VCardTitle>
        <VCardText>
          <p class="mb-4">Masukkan alasan suspend:</p>
          <AppTextarea
            v-model="suspendReason"
            label="Alasan"
            placeholder="Contoh: Pembayaran tertunggak"
            rows="3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="suspendDialogVisible = false">Batal</VBtn>
          <VBtn color="warning" :loading="isLoadingAction" :disabled="!suspendReason" @click="handleSuspend">
            Suspend
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation -->
    <VDialog v-model="deleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>Konfirmasi Hapus</VCardTitle>
        <VCardText>Apakah Anda yakin ingin menghapus company ini? Semua data terkait akan ikut terhapus.</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="deleteDialogVisible = false">Batal</VBtn>
          <VBtn color="error" :loading="isLoadingAction" @click="handleDelete">Hapus</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
