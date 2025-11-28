<script setup lang="ts">
import { useAdminModuleStore } from '@/stores/admin/systemConfigStore'

definePage({
  meta: {
    name: 'Admin Modules',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const moduleStore = useAdminModuleStore()
const { modules, isLoading, dialogVisible, dialogMode, form, isLoadingSubmit } = storeToRefs(moduleStore)

const deleteDialogVisible = ref(false)
const moduleToDelete = ref<string | null>(null)

onMounted(async () => {
  await moduleStore.fetchModules()
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'secondary',
    beta: 'warning',
  }
  return colors[status] || 'secondary'
}

const confirmDelete = (moduleId: string) => {
  moduleToDelete.value = moduleId
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (moduleToDelete.value) {
    await moduleStore.deleteModule(moduleToDelete.value)
    deleteDialogVisible.value = false
    moduleToDelete.value = null
  }
}

const handleSubmit = async () => {
  if (dialogMode.value === 'create') {
    await moduleStore.createModule()
  } else {
    await moduleStore.updateModule()
  }
}
</script>

<template>
  <div data-testid="admin-modules-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Module</h5>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="moduleStore.openDialog('create')">
          Tambah Module
        </VBtn>
      </VCardText>
    </VCard>

    <VRow v-if="isLoading" class="mt-4">
      <VCol cols="12" class="text-center py-10">
        <VProgressCircular indeterminate color="primary" />
      </VCol>
    </VRow>

    <VRow v-else class="mt-4">
      <VCol v-for="mod in modules" :key="mod.id" cols="12" sm="6" md="4" lg="3">
        <VCard>
          <VCardText class="text-center">
            <VAvatar color="primary" variant="tonal" size="64" class="mb-3">
              <VIcon :icon="mod.icon || 'tabler-box'" size="32" />
            </VAvatar>
            <h6 class="text-h6 mb-1">{{ mod.name }}</h6>
            <p class="text-caption text-disabled mb-2">{{ mod.code }}</p>
            <VChip size="small" :color="getStatusColor(mod.status)" class="mb-3">
              {{ mod.status }}
            </VChip>
            <p class="text-body-2 mb-0">{{ mod.description || '-' }}</p>
          </VCardText>
          <VDivider />
          <VCardActions class="justify-center">
            <IconBtn @click="moduleStore.openDialog('edit', mod)">
              <VIcon icon="tabler-edit" color="warning" />
            </IconBtn>
            <IconBtn @click="confirmDelete(mod.id)">
              <VIcon icon="tabler-trash" color="error" />
            </IconBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <!-- Module Dialog -->
    <VDialog v-model="dialogVisible" max-width="500">
      <VCard>
        <VCardTitle>{{ dialogMode === 'create' ? 'Tambah Module' : 'Edit Module' }}</VCardTitle>
        <VDivider />
        <VCardText>
          <VForm @submit.prevent="handleSubmit">
            <VRow>
              <VCol cols="12">
                <AppTextField v-model="form.code" label="Code" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12">
                <AppTextField v-model="form.name" label="Nama" :rules="[requiredValidator]" />
              </VCol>
              <VCol cols="12">
                <AppTextarea v-model="form.description" label="Deskripsi" rows="2" />
              </VCol>
              <VCol cols="12">
                <AppTextField v-model="form.icon" label="Icon (tabler)" placeholder="tabler-box" />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="form.status"
                  label="Status"
                  :items="[
                    { title: 'Active', value: 'active' },
                    { title: 'Inactive', value: 'inactive' },
                    { title: 'Beta', value: 'beta' },
                  ]"
                />
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
        <VCardText>Apakah Anda yakin ingin menghapus module ini?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="deleteDialogVisible = false">Batal</VBtn>
          <VBtn color="error" @click="handleDelete">Hapus</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
