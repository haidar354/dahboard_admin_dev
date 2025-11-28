<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminTenantOverrideStore } from '@/stores/admin/systemConfigStore'

definePage({
  meta: {
    name: 'Admin Tenant Overrides',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const overrideStore = useAdminTenantOverrideStore()
const { overrides, isLoading } = storeToRefs(overrideStore)

const deleteDialogVisible = ref(false)
const overrideToDelete = ref<string | null>(null)

onMounted(async () => {
  await overrideStore.fetchOverrides()
})

const getTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    module: 'primary',
    feature: 'success',
    permission: 'info',
    limit: 'warning',
  }
  return colors[type] || 'secondary'
}

const getActionColor = (action: string) => {
  const colors: Record<string, string> = {
    add: 'success',
    remove: 'error',
    modify: 'warning',
  }
  return colors[action] || 'secondary'
}

const confirmDelete = (overrideId: string) => {
  overrideToDelete.value = overrideId
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (overrideToDelete.value) {
    await overrideStore.deleteOverride(overrideToDelete.value)
    deleteDialogVisible.value = false
    overrideToDelete.value = null
  }
}
</script>

<template>
  <div data-testid="admin-tenant-overrides-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <div>
          <h5 class="text-h5">Tenant Capability Overrides</h5>
          <p class="text-body-2 text-disabled mb-0">Override konfigurasi khusus untuk tenant tertentu</p>
        </div>
      </VCardText>

      <VDivider />

      <VDataTable
        :headers="[
          { title: 'Company', key: 'companyName' },
          { title: 'Plan', key: 'planName' },
          { title: 'Tipe', key: 'type' },
          { title: 'Target', key: 'targetName' },
          { title: 'Aksi', key: 'action' },
          { title: 'Alasan', key: 'reason' },
          { title: 'Berlaku Sampai', key: 'expiresAt' },
          { title: 'Dibuat', key: 'createdAt' },
          { title: '', key: 'actions', width: '80px' },
        ]"
        :items="overrides"
        :loading="isLoading"
        class="text-no-wrap"
      >
        <template #item.companyName="{ item }">
          <span class="font-weight-medium">{{ item.companyName }}</span>
        </template>

        <template #item.planName="{ item }">
          <VChip size="small" color="primary" variant="tonal">
            {{ item.planName }}
          </VChip>
        </template>

        <template #item.type="{ item }">
          <VChip size="small" :color="getTypeColor(item.type)">
            {{ item.type }}
          </VChip>
        </template>

        <template #item.action="{ item }">
          <VChip size="small" :color="getActionColor(item.action)" variant="tonal">
            {{ item.action }}
          </VChip>
        </template>

        <template #item.reason="{ item }">
          <div style="max-width: 200px" class="text-truncate">
            {{ item.reason }}
          </div>
        </template>

        <template #item.expiresAt="{ item }">
          <span v-if="item.expiresAt">{{ dayjs(item.expiresAt).format('DD/MM/YYYY') }}</span>
          <span v-else class="text-disabled">Permanen</span>
        </template>

        <template #item.createdAt="{ item }">
          {{ dayjs(item.createdAt).format('DD/MM/YYYY') }}
        </template>

        <template #item.actions="{ item }">
          <IconBtn size="small" @click="confirmDelete(item.id)">
            <VIcon icon="tabler-trash" color="error" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Delete Confirmation -->
    <VDialog v-model="deleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>Konfirmasi Hapus</VCardTitle>
        <VCardText>Apakah Anda yakin ingin menghapus override ini?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="deleteDialogVisible = false">Batal</VBtn>
          <VBtn color="error" @click="handleDelete">Hapus</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
