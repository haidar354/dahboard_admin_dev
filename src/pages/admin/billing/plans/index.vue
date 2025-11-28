<script setup lang="ts">
import { useAdminPlanStore } from '@/stores/admin/billingStore'

definePage({
  meta: {
    name: 'Admin Plans',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const planStore = useAdminPlanStore()
const { plans, isLoading, dialogVisible, dialogMode, form, isLoadingSubmit } = storeToRefs(planStore)

const featureInput = ref('')

onMounted(async () => {
  await planStore.fetchPlans()
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

const addFeature = () => {
  if (featureInput.value.trim()) {
    form.value.features.push(featureInput.value.trim())
    featureInput.value = ''
  }
}

const removeFeature = (index: number) => {
  form.value.features.splice(index, 1)
}

const handleSubmit = async () => {
  if (dialogMode.value === 'create') {
    await planStore.createPlan()
  } else {
    await planStore.updatePlan()
  }
}
</script>

<template>
  <div data-testid="admin-plans-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Plan</h5>
        <VBtn color="primary" prepend-icon="tabler-plus" @click="planStore.openDialog('create')">
          Tambah Plan
        </VBtn>
      </VCardText>
    </VCard>

    <VRow v-if="isLoading" class="mt-4">
      <VCol cols="12" class="text-center py-10">
        <VProgressCircular indeterminate color="primary" />
      </VCol>
    </VRow>

    <VRow v-else class="mt-4">
      <VCol v-for="plan in plans" :key="plan.id" cols="12" md="4">
        <VCard :class="{ 'border-primary border-2': plan.isPopular }">
          <VCardText class="text-center pb-0">
            <VChip v-if="plan.isPopular" color="primary" size="small" class="mb-2">
              Paling Populer
            </VChip>
            <h4 class="text-h4 mb-1">{{ plan.name }}</h4>
            <p class="text-body-2 text-disabled mb-4">{{ plan.description }}</p>
            
            <div class="d-flex align-center justify-center gap-1 mb-4">
              <h3 class="text-h3 text-primary">{{ formatCurrency(plan.price) }}</h3>
              <span class="text-body-2">/{{ plan.billingCycle === 'monthly' ? 'bulan' : 'tahun' }}</span>
            </div>

            <VChip size="small" :color="plan.isActive ? 'success' : 'error'" class="mb-4">
              {{ plan.isActive ? 'Aktif' : 'Tidak Aktif' }}
            </VChip>
          </VCardText>

          <VDivider />

          <VCardText>
            <p class="text-body-2 font-weight-medium mb-3">Fitur:</p>
            <VList density="compact" class="py-0">
              <VListItem
                v-for="(feature, index) in plan.features"
                :key="index"
                class="px-0"
              >
                <template #prepend>
                  <VIcon icon="tabler-check" color="success" size="18" class="me-2" />
                </template>
                <VListItemTitle class="text-body-2">{{ feature }}</VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>

          <VCardActions class="justify-center pb-4">
            <VBtn variant="outlined" color="primary" @click="planStore.openDialog('edit', plan)">
              <VIcon icon="tabler-edit" class="me-1" />
              Edit
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>

    <!-- Plan Dialog -->
    <VDialog v-model="dialogVisible" max-width="600" persistent>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ dialogMode === 'create' ? 'Tambah Plan' : 'Edit Plan' }}</span>
          <IconBtn @click="dialogVisible = false">
            <VIcon icon="tabler-x" />
          </IconBtn>
        </VCardTitle>

        <VDivider />

        <VCardText>
          <VForm @submit.prevent="handleSubmit">
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.name"
                  label="Nama Plan"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.code"
                  label="Code"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="form.description"
                  label="Deskripsi"
                  rows="2"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model.number="form.price"
                  label="Harga"
                  type="number"
                  :rules="[requiredValidator]"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect
                  v-model="form.billingCycle"
                  label="Siklus Billing"
                  :items="[
                    { title: 'Bulanan', value: 'monthly' },
                    { title: 'Tahunan', value: 'yearly' },
                  ]"
                />
              </VCol>
              <VCol cols="12">
                <VSwitch v-model="form.isActive" label="Plan Aktif" color="primary" />
              </VCol>
              <VCol cols="12">
                <p class="text-body-2 font-weight-medium mb-2">Fitur:</p>
                <div class="d-flex gap-2 mb-3">
                  <AppTextField
                    v-model="featureInput"
                    placeholder="Tambah fitur..."
                    density="compact"
                    @keyup.enter="addFeature"
                  />
                  <VBtn color="primary" size="small" @click="addFeature">Tambah</VBtn>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <VChip
                    v-for="(feat, idx) in form.features"
                    :key="idx"
                    closable
                    color="primary"
                    variant="tonal"
                    @click:close="removeFeature(idx)"
                  >
                    {{ feat }}
                  </VChip>
                </div>
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
  </div>
</template>
