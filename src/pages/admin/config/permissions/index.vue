<script setup lang="ts">
import { useAdminPermissionStore } from '@/stores/admin/systemConfigStore'

definePage({
  meta: {
    name: 'Admin Permissions',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const permissionStore = useAdminPermissionStore()
const { permissions, isLoading, dialogVisible, form, isLoadingSubmit } = storeToRefs(permissionStore)

const search = ref('')
const selectedModule = ref('')
const deleteDialogVisible = ref(false)
const permToDelete = ref<string | null>(null)

const uniqueModules = computed(() => {
  const mods = new Set(permissions.value.map(p => p.module))
  return Array.from(mods)
})

const filteredPermissions = computed(() => {
  let data = permissions.value
  if (selectedModule.value) {
    data = data.filter(p => p.module === selectedModule.value)
  }
  if (search.value) {
    const s = search.value.toLowerCase()
    data = data.filter(p => 
      p.name.toLowerCase().includes(s) ||
      p.code.toLowerCase().includes(s)
    )
  }
  return data
})

onMounted(async () => {
  await permissionStore.fetchPermissions()
})

const confirmDelete = (permId: string) => {
  permToDelete.value = permId
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (permToDelete.value) {
    await permissionStore.deletePermission(permToDelete.value)
    deleteDialogVisible.value = false
    permToDelete.value = null
  }
}

const handleSubmit = async () => {
  await permissionStore.createPermission()
}
</script>

<template>
  <div data-testid="admin-permissions-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Permission</h5>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="dialogVisible = true">
          Tambah Permission
        </VBtn>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari permission..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppSelect
              v-model="selectedModule"
              label="Filter Module"
              :items="[{ title: 'Semua', value: '' }, ...uniqueModules.map(m => ({ title: m, value: m }))]"
              clearable
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDataTable
        :headers="[
          { title: 'No', key: 'index', width: '60px' },
          { title: 'Code', key: 'code' },
          { title: 'Nama', key: 'name' },
          { title: 'Module', key: 'module' },
          { title: 'Deskripsi', key: 'description' },
          { title: 'Aksi', key: 'actions', width: '80px' },
        ]"
        :items="filteredPermissions"
        :loading="isLoading"
        class="text-no-wrap"
      >
        <template #item.index="{ index }">
          {{ index + 1 }}
        </template>

        <template #item.code="{ item }">
          <code>{{ item.code }}</code>
        </template>

        <template #item.module="{ item }">
          <VChip size="small" color="secondary" variant="tonal">
            {{ item.module }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <IconBtn size="small" @click="confirmDelete(item.id)">
            <VIcon icon="tabler-trash" color="error" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Permission Dialog -->
    <VDialog v-model="dialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Tambah Permission</VCardTitle>
        <VDivider />
        <VCardText>
          <VForm @submit.prevent="handleSubmit">
            <VRow>
              <VCol cols="12">
                <AppTextField v-model="form.code" label="Code" placeholder="user.view" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12">
                <AppTextField v-model="form.name" label="Nama" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12">
                <AppTextField v-model="form.module" label="Module" placeholder="IAM" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12">
                <AppTextarea v-model="form.description" label="Deskripsi" rows="2" />
              </VCol>
            </VRow>
            <div class="d-flex justify-end gap-3 mt-4">
              <VBtn variant="outlined" @click="dialogVisible = false">Batal</VBtn>
              <VBtn type="submit" color="primary" :loading="isLoadingSubmit">Simpan</VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation -->
    <VDialog v-model="deleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>Konfirmasi Hapus</VCardTitle>
        <VCardText>Apakah Anda yakin ingin menghapus permission ini?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="deleteDialogVisible = false">Batal</VBtn>
          <VBtn color="error" @click="handleDelete">Hapus</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
