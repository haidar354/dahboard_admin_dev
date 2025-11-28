<script setup lang="ts">
import { useAdminFeatureStore, useAdminModuleStore } from '@/stores/admin/systemConfigStore'

definePage({
  meta: {
    name: 'Admin Features',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const featureStore = useAdminFeatureStore()
const moduleStore = useAdminModuleStore()
const { features, isLoading, dialogVisible, form, isLoadingSubmit } = storeToRefs(featureStore)
const { modules } = storeToRefs(moduleStore)

const search = ref('')
const selectedModule = ref('')
const deleteDialogVisible = ref(false)
const featureToDelete = ref<string | null>(null)

const filteredFeatures = computed(() => {
  let data = features.value
  if (selectedModule.value) {
    data = data.filter(f => f.moduleId === selectedModule.value)
  }
  if (search.value) {
    const s = search.value.toLowerCase()
    data = data.filter(f => 
      f.name.toLowerCase().includes(s) ||
      f.code.toLowerCase().includes(s)
    )
  }
  return data
})

onMounted(async () => {
  await Promise.all([
    featureStore.fetchFeatures(),
    moduleStore.fetchModules(),
  ])
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'secondary',
    beta: 'warning',
  }
  return colors[status] || 'secondary'
}

const confirmDelete = (featureId: string) => {
  featureToDelete.value = featureId
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (featureToDelete.value) {
    await featureStore.deleteFeature(featureToDelete.value)
    deleteDialogVisible.value = false
    featureToDelete.value = null
  }
}

const handleSubmit = async () => {
  await featureStore.createFeature()
}
</script>

<template>
  <div data-testid="admin-features-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Feature</h5>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="featureStore.openDialog('create')">
          Tambah Feature
        </VBtn>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari feature..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppSelect
              v-model="selectedModule"
              label="Filter Module"
              :items="[{ title: 'Semua Module', value: '' }, ...modules.map(m => ({ title: m.name, value: m.id }))]"
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
          { title: 'Module', key: 'moduleName' },
          { title: 'Status', key: 'status' },
          { title: 'Aksi', key: 'actions', width: '100px' },
        ]"
        :items="filteredFeatures"
        :loading="isLoading"
        class="text-no-wrap"
      >
        <template #item.index="{ index }">
          {{ index + 1 }}
        </template>

        <template #item.code="{ item }">
          <code>{{ item.code }}</code>
        </template>

        <template #item.moduleName="{ item }">
          <VChip size="small" color="primary" variant="tonal">
            {{ item.moduleName }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="getStatusColor(item.status)">
            {{ item.status }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <IconBtn size="small" @click="confirmDelete(item.id)">
            <VIcon icon="tabler-trash" color="error" />
          </IconBtn>
        </template>
      </VDataTable>
    </VCard>

    <!-- Feature Dialog -->
    <VDialog v-model="dialogVisible" max-width="500">
      <VCard>
        <VCardTitle>Tambah Feature</VCardTitle>
        <VDivider />
        <VCardText>
          <VForm @submit.prevent="handleSubmit">
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="form.moduleId"
                  label="Module"
                  :items="modules.map(m => ({ title: m.name, value: m.id }))"
                  :rules="[requiredValidator]"
                />
              </VCol>
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
        <VCardText>Apakah Anda yakin ingin menghapus feature ini?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="deleteDialogVisible = false">Batal</VBtn>
          <VBtn color="error" @click="handleDelete">Hapus</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
