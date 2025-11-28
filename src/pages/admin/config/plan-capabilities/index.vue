<script setup lang="ts">
import { useAdminPlanCapabilityStore } from '@/stores/admin/systemConfigStore'

definePage({
  meta: {
    name: 'Admin Plan Capabilities',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const capabilityStore = useAdminPlanCapabilityStore()
const { planCapabilities, isLoading } = storeToRefs(capabilityStore)

onMounted(async () => {
  await capabilityStore.fetchPlanCapabilities()
})

const formatLimit = (value: number) => {
  return value === -1 ? 'Unlimited' : value.toString()
}
</script>

<template>
  <div data-testid="admin-plan-capabilities-page">
    <VCard class="mb-4">
      <VCardText>
        <h5 class="text-h5">Plan Capabilities</h5>
        <p class="text-body-2 text-disabled mb-0">Konfigurasi modul, fitur, dan limit untuk setiap plan</p>
      </VCardText>
    </VCard>

    <VRow v-if="isLoading">
      <VCol cols="12" class="text-center py-10">
        <VProgressCircular indeterminate color="primary" />
      </VCol>
    </VRow>

    <VRow v-else>
      <VCol v-for="cap in planCapabilities" :key="cap.id" cols="12" lg="4">
        <VCard>
          <VCardTitle class="bg-primary text-white">
            {{ cap.planName }}
          </VCardTitle>

          <VCardText class="pt-4">
            <!-- Modules -->
            <div class="mb-4">
              <h6 class="text-h6 mb-2">Modules ({{ cap.modules.length }})</h6>
              <div class="d-flex flex-wrap gap-1">
                <VChip
                  v-for="modName in cap.moduleNames"
                  :key="modName"
                  size="small"
                  color="primary"
                  variant="tonal"
                >
                  {{ modName }}
                </VChip>
              </div>
            </div>

            <VDivider class="mb-4" />

            <!-- Features -->
            <div class="mb-4">
              <h6 class="text-h6 mb-2">Features ({{ cap.features.length }})</h6>
              <div class="d-flex flex-wrap gap-1">
                <VChip
                  v-for="featName in cap.featureNames"
                  :key="featName"
                  size="small"
                  color="success"
                  variant="tonal"
                >
                  {{ featName }}
                </VChip>
              </div>
            </div>

            <VDivider class="mb-4" />

            <!-- Limits -->
            <div>
              <h6 class="text-h6 mb-2">Limits</h6>
              <VList density="compact" class="py-0">
                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon icon="tabler-users" size="18" color="primary" class="me-2" />
                  </template>
                  <VListItemTitle class="text-body-2">Max Users</VListItemTitle>
                  <template #append>
                    <span class="text-body-2 font-weight-medium">{{ formatLimit(cap.limits.maxUsers) }}</span>
                  </template>
                </VListItem>
                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon icon="tabler-building-store" size="18" color="primary" class="me-2" />
                  </template>
                  <VListItemTitle class="text-body-2">Max Outlets</VListItemTitle>
                  <template #append>
                    <span class="text-body-2 font-weight-medium">{{ formatLimit(cap.limits.maxOutlets) }}</span>
                  </template>
                </VListItem>
                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon icon="tabler-package" size="18" color="primary" class="me-2" />
                  </template>
                  <VListItemTitle class="text-body-2">Max Products</VListItemTitle>
                  <template #append>
                    <span class="text-body-2 font-weight-medium">{{ formatLimit(cap.limits.maxProducts) }}</span>
                  </template>
                </VListItem>
                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon icon="tabler-receipt" size="18" color="primary" class="me-2" />
                  </template>
                  <VListItemTitle class="text-body-2">Max Transactions/mo</VListItemTitle>
                  <template #append>
                    <span class="text-body-2 font-weight-medium">{{ formatLimit(cap.limits.maxTransactions) }}</span>
                  </template>
                </VListItem>
                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon icon="tabler-database" size="18" color="primary" class="me-2" />
                  </template>
                  <VListItemTitle class="text-body-2">Storage</VListItemTitle>
                  <template #append>
                    <span class="text-body-2 font-weight-medium">{{ cap.limits.storageGB }} GB</span>
                  </template>
                </VListItem>
              </VList>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
