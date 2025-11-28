<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminUserStore } from '@/stores/admin/userStore'

definePage({
  meta: {
    name: 'Admin Users',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const userStore = useAdminUserStore()
const { paginateData, isLoading, requestQuery, roles, dialogVisible, dialogMode, form, isLoadingSubmit, isLoadingDelete } = storeToRefs(userStore)

const search = ref('')
const deleteDialogVisible = ref(false)
const userToDelete = ref<string | null>(null)

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Nama', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role.name', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Login Terakhir', key: 'lastLoginAt', sortable: true },
  { title: 'Aksi', key: 'actions', width: '120px', sortable: false },
]

watch(search, customDebounce((val: string) => {
  requestQuery.value.search = val
  requestQuery.value.page = 1
}, 500))

watch(requestQuery, async () => {
  await userStore.fetchUsers()
}, { deep: true })

onMounted(async () => {
  await Promise.all([
    userStore.fetchUsers(),
    userStore.fetchRoles(),
  ])
})

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'success',
    inactive: 'secondary',
    suspended: 'error',
  }
  return colors[status] || 'secondary'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    suspended: 'Suspended',
  }
  return texts[status] || status
}

const confirmDelete = (userId: string) => {
  userToDelete.value = userId
  deleteDialogVisible.value = true
}

const handleDelete = async () => {
  if (userToDelete.value) {
    await userStore.deleteUser(userToDelete.value)
    deleteDialogVisible.value = false
    userToDelete.value = null
  }
}

const handleSubmit = async () => {
  if (dialogMode.value === 'create') {
    await userStore.createUser()
  } else if (dialogMode.value === 'edit') {
    await userStore.updateUser()
  }
}
</script>

<template>
  <div data-testid="admin-users-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen User Admin</h5>
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          @click="userStore.openDialog('create')"
        >
          Tambah User
        </VBtn>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari user..."
              prepend-inner-icon="tabler-search"
              clearable
            />
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
          <div class="d-flex align-center gap-3">
            <VAvatar color="primary" variant="tonal" size="38">
              <VImg v-if="item.avatar" :src="item.avatar" />
              <span v-else class="text-sm">{{ item.name.charAt(0).toUpperCase() }}</span>
            </VAvatar>
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-disabled">{{ item.phone || '-' }}</div>
            </div>
          </div>
        </template>

        <template #item.role.name="{ item }">
          <VChip size="small" :color="item.role.code === 'super_admin' ? 'primary' : 'secondary'">
            {{ item.role.name }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="getStatusColor(item.status)">
            {{ getStatusText(item.status) }}
          </VChip>
        </template>

        <template #item.lastLoginAt="{ item }">
          {{ item.lastLoginAt ? dayjs(item.lastLoginAt).format('DD/MM/YYYY HH:mm') : '-' }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="userStore.openDialog('view', item)">
              <VIcon icon="tabler-eye" color="info" />
            </IconBtn>
            <IconBtn size="small" @click="userStore.openDialog('edit', item)">
              <VIcon icon="tabler-edit" color="warning" />
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

    <!-- User Dialog -->
    <VDialog v-model="dialogVisible" max-width="600">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ dialogMode === 'create' ? 'Tambah User' : dialogMode === 'edit' ? 'Edit User' : 'Detail User' }}</span>
          <IconBtn @click="userStore.closeDialog()">
            <VIcon icon="tabler-x" />
          </IconBtn>
        </VCardTitle>

        <VDivider />

        <VCardText>
          <VForm @submit.prevent="handleSubmit">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="form.name"
                  label="Nama"
                  placeholder="Masukkan nama"
                  :rules="[requiredValidator]"
                  :readonly="dialogMode === 'view'"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  label="Email"
                  type="email"
                  placeholder="Masukkan email"
                  :rules="[requiredValidator, emailValidator]"
                  :readonly="dialogMode === 'view'"
                />
              </VCol>
              <VCol cols="12">
                <AppTextField
                  v-model="form.phone"
                  label="Telepon"
                  placeholder="Masukkan nomor telepon"
                  :readonly="dialogMode === 'view'"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="form.roleId"
                  label="Role"
                  :items="roles"
                  item-title="name"
                  item-value="id"
                  :rules="[requiredValidator]"
                  :readonly="dialogMode === 'view'"
                />
              </VCol>
              <VCol v-if="dialogMode === 'create'" cols="12">
                <AppTextField
                  v-model="form.password"
                  label="Password"
                  type="password"
                  placeholder="Masukkan password"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="12">
                <AppSelect
                  v-model="form.status"
                  label="Status"
                  :items="[
                    { title: 'Aktif', value: 'active' },
                    { title: 'Tidak Aktif', value: 'inactive' },
                  ]"
                  :readonly="dialogMode === 'view'"
                />
              </VCol>
            </VRow>

            <div v-if="dialogMode !== 'view'" class="d-flex justify-end gap-3 mt-4">
              <VBtn variant="outlined" color="secondary" @click="userStore.closeDialog()">
                Batal
              </VBtn>
              <VBtn type="submit" color="primary" :loading="isLoadingSubmit">
                {{ dialogMode === 'create' ? 'Simpan' : 'Update' }}
              </VBtn>
            </div>
          </VForm>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation -->
    <VDialog v-model="deleteDialogVisible" max-width="400">
      <VCard>
        <VCardTitle>Konfirmasi Hapus</VCardTitle>
        <VCardText>Apakah Anda yakin ingin menghapus user ini?</VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="deleteDialogVisible = false">Batal</VBtn>
          <VBtn color="error" :loading="isLoadingDelete" @click="handleDelete">Hapus</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
