<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminErrorLogStore } from '@/stores/admin/supportStore'

definePage({
  meta: {
    name: 'Admin Error Logs',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const errorLogStore = useAdminErrorLogStore()
const { paginateData, isLoading, requestQuery, additionalFilter, selectedLog } = storeToRefs(errorLogStore)

const search = ref('')
const detailDialogVisible = ref(false)

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Level', key: 'level', sortable: false },
  { title: 'Source', key: 'source', sortable: true },
  { title: 'Message', key: 'message', sortable: false },
  { title: 'Company', key: 'companyName', sortable: true },
  { title: 'Waktu', key: 'createdAt', sortable: true },
  { title: 'Aksi', key: 'actions', width: '80px', sortable: false },
]

watch(search, customDebounce((val: string) => {
  requestQuery.value.search = val
  requestQuery.value.page = 1
}, 500))

watch([requestQuery, additionalFilter], async () => {
  await errorLogStore.fetchErrorLogs()
}, { deep: true })

onMounted(async () => {
  await errorLogStore.fetchErrorLogs()
})

const getLevelColor = (level: string) => {
  const colors: Record<string, string> = {
    info: 'info',
    warning: 'warning',
    error: 'error',
    critical: 'error',
  }
  return colors[level] || 'secondary'
}

const getLevelIcon = (level: string) => {
  const icons: Record<string, string> = {
    info: 'tabler-info-circle',
    warning: 'tabler-alert-triangle',
    error: 'tabler-x-circle',
    critical: 'tabler-alert-octagon',
  }
  return icons[level] || 'tabler-circle'
}

const viewDetail = (log: typeof paginateData.value.data[0]) => {
  selectedLog.value = log
  detailDialogVisible.value = true
}
</script>

<template>
  <div data-testid="admin-error-logs-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Error Logs</h5>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="search"
              placeholder="Cari log..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="3">
            <AppSelect
              v-model="additionalFilter.level"
              label="Level"
              :items="[
                { title: 'Semua', value: '' },
                { title: 'Info', value: 'info' },
                { title: 'Warning', value: 'warning' },
                { title: 'Error', value: 'error' },
                { title: 'Critical', value: 'critical' },
              ]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2" class="d-flex align-center">
            <VBtn variant="outlined" @click="errorLogStore.resetFilter()">Reset</VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDataTable
        :headers="headers"
        :items="paginateData.data"
        :loading="isLoading"
        :items-per-page="requestQuery.perPage"
        class="text-no-wrap"
      >
        <template #item.index="{ index }">
          {{ (requestQuery.page! - 1) * requestQuery.perPage! + index + 1 }}
        </template>

        <template #item.level="{ item }">
          <VChip size="small" :color="getLevelColor(item.level)">
            <VIcon :icon="getLevelIcon(item.level)" size="14" class="me-1" />
            {{ item.level }}
          </VChip>
        </template>

        <template #item.source="{ item }">
          <code class="text-body-2">{{ item.source }}</code>
        </template>

        <template #item.message="{ item }">
          <div style="max-width: 300px" class="text-truncate">
            {{ item.message }}
          </div>
        </template>

        <template #item.companyName="{ item }">
          {{ item.companyName || 'System' }}
        </template>

        <template #item.createdAt="{ item }">
          {{ dayjs(item.createdAt).format('DD/MM/YYYY HH:mm:ss') }}
        </template>

        <template #item.actions="{ item }">
          <IconBtn size="small" @click="viewDetail(item)">
            <VIcon icon="tabler-eye" color="info" />
          </IconBtn>
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

    <!-- Detail Dialog -->
    <VDialog v-model="detailDialogVisible" max-width="700">
      <VCard v-if="selectedLog">
        <VCardTitle class="d-flex justify-space-between align-center">
          <div class="d-flex align-center gap-2">
            <VChip size="small" :color="getLevelColor(selectedLog.level)">
              {{ selectedLog.level }}
            </VChip>
            <span>Error Detail</span>
          </div>
          <IconBtn @click="detailDialogVisible = false">
            <VIcon icon="tabler-x" />
          </IconBtn>
        </VCardTitle>

        <VDivider />

        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <p class="text-body-2 text-disabled mb-1">Source</p>
              <code>{{ selectedLog.source }}</code>
            </VCol>
            <VCol cols="12" md="6">
              <p class="text-body-2 text-disabled mb-1">Company</p>
              <span>{{ selectedLog.companyName || 'System' }}</span>
            </VCol>
            <VCol cols="12">
              <p class="text-body-2 text-disabled mb-1">Message</p>
              <VCard variant="outlined" class="pa-3">
                <p class="text-body-2 mb-0 text-error">{{ selectedLog.message }}</p>
              </VCard>
            </VCol>
            <VCol v-if="selectedLog.stackTrace" cols="12">
              <p class="text-body-2 text-disabled mb-1">Stack Trace</p>
              <VCard variant="outlined" class="pa-3 bg-grey-darken-4">
                <pre class="text-caption mb-0" style="white-space: pre-wrap;">{{ selectedLog.stackTrace }}</pre>
              </VCard>
            </VCol>
            <VCol v-if="selectedLog.context" cols="12">
              <p class="text-body-2 text-disabled mb-1">Context</p>
              <VCard variant="outlined" class="pa-3">
                <pre class="text-caption mb-0">{{ JSON.stringify(selectedLog.context, null, 2) }}</pre>
              </VCard>
            </VCol>
            <VCol cols="12" md="6">
              <p class="text-body-2 text-disabled mb-1">Request URL</p>
              <span>{{ selectedLog.requestUrl || '-' }}</span>
            </VCol>
            <VCol cols="12" md="6">
              <p class="text-body-2 text-disabled mb-1">IP Address</p>
              <span>{{ selectedLog.ipAddress || '-' }}</span>
            </VCol>
            <VCol cols="12">
              <p class="text-body-2 text-disabled mb-1">Timestamp</p>
              <span>{{ dayjs(selectedLog.createdAt).format('DD/MM/YYYY HH:mm:ss') }}</span>
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn variant="outlined" @click="detailDialogVisible = false">Tutup</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
