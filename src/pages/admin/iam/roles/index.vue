<script setup lang="ts">
import { useAdminUserStore } from '@/stores/admin/userStore'

definePage({
  meta: {
    name: 'Admin Roles',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const userStore = useAdminUserStore()
const { roles, isLoading } = storeToRefs(userStore)

onMounted(async () => {
  await userStore.fetchRoles()
})

const getRoleColor = (code: string) => {
  const colors: Record<string, string> = {
    super_admin: 'primary',
    support_admin: 'info',
    billing_admin: 'success',
  }
  return colors[code] || 'secondary'
}
</script>

<template>
  <div data-testid="admin-roles-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Role</h5>
      </VCardText>

      <VDivider />

      <VCardText v-if="isLoading" class="text-center py-10">
        <VProgressCircular indeterminate color="primary" />
      </VCardText>

      <VCardText v-else>
        <VRow>
          <VCol v-for="role in roles" :key="role.id" cols="12" md="4">
            <VCard variant="outlined" :color="getRoleColor(role.code)">
              <VCardText>
                <div class="d-flex align-center gap-3 mb-3">
                  <VAvatar :color="getRoleColor(role.code)" variant="tonal" size="48">
                    <VIcon 
                      :icon="role.code === 'super_admin' ? 'tabler-crown' : role.code === 'support_admin' ? 'tabler-headset' : 'tabler-receipt'" 
                      size="24" 
                    />
                  </VAvatar>
                  <div>
                    <h6 class="text-h6">{{ role.name }}</h6>
                    <p class="text-caption text-disabled mb-0">{{ role.code }}</p>
                  </div>
                </div>

                <p class="text-body-2 mb-3">{{ role.description }}</p>

                <VDivider class="mb-3" />

                <p class="text-body-2 font-weight-medium mb-2">Permissions:</p>
                <div class="d-flex flex-wrap gap-1">
                  <VChip
                    v-for="(perm, idx) in role.permissions.slice(0, 5)"
                    :key="idx"
                    size="x-small"
                    color="secondary"
                  >
                    {{ perm === '*' ? 'Semua Akses' : perm }}
                  </VChip>
                  <VChip
                    v-if="role.permissions.length > 5"
                    size="x-small"
                    color="primary"
                  >
                    +{{ role.permissions.length - 5 }} lainnya
                  </VChip>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>
  </div>
</template>
