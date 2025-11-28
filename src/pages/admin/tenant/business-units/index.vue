<script setup lang="ts">
import { mockBusinessUnits } from '@/plugins/fake-api/handlers/admin/mockTenantData'
import type { AdminBusinessUnit } from '@/types/models/admin'

definePage({
  meta: {
    name: 'Admin Business Units',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const isLoading = ref(false)
const businessUnits = ref<AdminBusinessUnit[]>([])
const search = ref('')

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Nama', key: 'name', sortable: true },
  { title: 'Company', key: 'companyName', sortable: true },
  { title: 'Code', key: 'code', sortable: false },
  { title: 'Outlets', key: 'outletsCount', sortable: false, align: 'center' },
  { title: 'Status', key: 'status', sortable: false },
]

const filteredData = computed(() => {
  if (!search.value) return businessUnits.value
  const s = search.value.toLowerCase()
  return businessUnits.value.filter(bu =>
    bu.name.toLowerCase().includes(s) ||
    bu.companyName.toLowerCase().includes(s) ||
    bu.code.toLowerCase().includes(s)
  )
})

onMounted(async () => {
  isLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  businessUnits.value = mockBusinessUnits
  isLoading.value = false
})
</script>

<template>
  <div data-testid="admin-business-units-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Business Unit</h5>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari business unit..."
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
              <VIcon icon="tabler-hierarchy-2" />
            </VAvatar>
            <div>
              <span class="font-weight-medium">{{ item.name }}</span>
              <div class="text-caption text-disabled">{{ item.address || '-' }}</div>
            </div>
          </div>
        </template>

        <template #item.companyName="{ item }">
          <VChip size="small" color="secondary" variant="tonal">
            {{ item.companyName }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="item.status === 'active' ? 'success' : 'secondary'">
            {{ item.status === 'active' ? 'Aktif' : 'Tidak Aktif' }}
          </VChip>
        </template>
      </VDataTable>
    </VCard>
  </div>
</template>
