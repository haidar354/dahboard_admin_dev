<script setup lang="ts">
import { mockOutlets } from '@/plugins/fake-api/handlers/admin/mockTenantData'
import type { AdminOutlet } from '@/types/models/admin'

definePage({
  meta: {
    name: 'Admin Outlets',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const isLoading = ref(false)
const outlets = ref<AdminOutlet[]>([])
const search = ref('')

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Nama', key: 'name', sortable: true },
  { title: 'Company', key: 'companyName', sortable: true },
  { title: 'Business Unit', key: 'businessUnitName', sortable: true },
  { title: 'Code', key: 'code', sortable: false },
  { title: 'Tipe', key: 'isCentral', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
]

const filteredData = computed(() => {
  if (!search.value) return outlets.value
  const s = search.value.toLowerCase()
  return outlets.value.filter(o =>
    o.name.toLowerCase().includes(s) ||
    o.companyName.toLowerCase().includes(s) ||
    o.businessUnitName.toLowerCase().includes(s) ||
    o.code.toLowerCase().includes(s)
  )
})

onMounted(async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  outlets.value = mockOutlets
  isLoading.value = false
})
</script>

<template>
  <div data-testid="admin-outlets-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Outlet</h5>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari outlet..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDataTable
        :headers="headers"
        :items="filteredData"
        :loading="isLoading"
        class="text-no-wrap"
      >
        <template #item.index="{ index }">
          {{ index + 1 }}
        </template>

        <template #item.name="{ item }">
          <div class="d-flex align-center gap-3">
            <VAvatar color="primary" variant="tonal" size="38">
              <VIcon icon="tabler-building-store" />
            </VAvatar>
            <div>
              <span class="font-weight-medium">{{ item.name }}</span>
              <div class="text-caption text-disabled">{{ item.address || '-' }}</div>
            </div>
          </div>
        </template>

        <template #item.companyName="{ item }">
          <span class="text-body-2">{{ item.companyName }}</span>
        </template>

        <template #item.businessUnitName="{ item }">
          <VChip size="small" color="secondary" variant="tonal">
            {{ item.businessUnitName }}
          </VChip>
        </template>

        <template #item.isCentral="{ item }">
          <VChip size="small" :color="item.isCentral ? 'primary' : 'info'">
            {{ item.isCentral ? 'Pusat' : 'Cabang' }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="item.status === 'active' ? 'success' : item.status === 'closed' ? 'error' : 'secondary'">
            {{ item.status === 'active' ? 'Aktif' : item.status === 'closed' ? 'Tutup' : 'Tidak Aktif' }}
          </VChip>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
