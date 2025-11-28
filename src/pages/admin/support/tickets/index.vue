<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminTicketStore } from '@/stores/admin/supportStore'

definePage({
  meta: {
    name: 'Admin Tickets',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const ticketStore = useAdminTicketStore()
const { paginateData, isLoading, requestQuery, additionalFilter, selectedTicket, isLoadingAction, replyMessage } = storeToRefs(ticketStore)

const search = ref('')
const detailDialogVisible = ref(false)

const headers = [
  { title: 'No', key: 'index', width: '60px', sortable: false },
  { title: 'Ticket', key: 'ticketNumber', sortable: true },
  { title: 'Company', key: 'companyName', sortable: true },
  { title: 'Subject', key: 'subject', sortable: false },
  { title: 'Kategori', key: 'category', sortable: false },
  { title: 'Prioritas', key: 'priority', sortable: false },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Assigned', key: 'assignedToName', sortable: false },
  { title: 'Aksi', key: 'actions', width: '120px', sortable: false },
]

watch(search, customDebounce((val: string) => {
  requestQuery.value.search = val
  requestQuery.value.page = 1
}, 500))

watch([requestQuery, additionalFilter], async () => {
  await ticketStore.fetchTickets()
}, { deep: true })

onMounted(async () => {
  await ticketStore.fetchTickets()
})

const getCategoryText = (cat: string) => {
  const texts: Record<string, string> = {
    technical: 'Teknis',
    billing: 'Billing',
    feature_request: 'Fitur',
    general: 'Umum',
  }
  return texts[cat] || cat
}

const getCategoryColor = (cat: string) => {
  const colors: Record<string, string> = {
    technical: 'error',
    billing: 'warning',
    feature_request: 'info',
    general: 'secondary',
  }
  return colors[cat] || 'secondary'
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'success',
    medium: 'info',
    high: 'warning',
    urgent: 'error',
  }
  return colors[priority] || 'secondary'
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    open: 'error',
    in_progress: 'warning',
    waiting_response: 'info',
    resolved: 'success',
    closed: 'secondary',
  }
  return colors[status] || 'secondary'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    waiting_response: 'Menunggu Response',
    resolved: 'Resolved',
    closed: 'Closed',
  }
  return texts[status] || status
}

const viewTicket = async (ticketId: string) => {
  await ticketStore.fetchTicketDetail(ticketId)
  detailDialogVisible.value = true
}

const handleReply = async () => {
  if (selectedTicket.value && replyMessage.value) {
    await ticketStore.replyTicket(selectedTicket.value.id, replyMessage.value)
  }
}

const handleClose = async () => {
  if (selectedTicket.value) {
    await ticketStore.closeTicket(selectedTicket.value.id)
    detailDialogVisible.value = false
  }
}
</script>

<template>
  <div data-testid="admin-tickets-page">
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between align-center gap-4">
        <h5 class="text-h5">Manajemen Ticket</h5>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol cols="12" sm="3">
            <AppTextField
              v-model="search"
              placeholder="Cari ticket..."
              prepend-inner-icon="tabler-search"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2">
            <AppSelect
              v-model="additionalFilter.status"
              label="Status"
              :items="[
                { title: 'Semua', value: '' },
                { title: 'Open', value: 'open' },
                { title: 'In Progress', value: 'in_progress' },
                { title: 'Menunggu Response', value: 'waiting_response' },
                { title: 'Resolved', value: 'resolved' },
                { title: 'Closed', value: 'closed' },
              ]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2">
            <AppSelect
              v-model="additionalFilter.priority"
              label="Prioritas"
              :items="[
                { title: 'Semua', value: '' },
                { title: 'Urgent', value: 'urgent' },
                { title: 'High', value: 'high' },
                { title: 'Medium', value: 'medium' },
                { title: 'Low', value: 'low' },
              ]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2">
            <AppSelect
              v-model="additionalFilter.category"
              label="Kategori"
              :items="[
                { title: 'Semua', value: '' },
                { title: 'Teknis', value: 'technical' },
                { title: 'Billing', value: 'billing' },
                { title: 'Fitur', value: 'feature_request' },
                { title: 'Umum', value: 'general' },
              ]"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="2" class="d-flex align-center">
            <VBtn variant="outlined" @click="ticketStore.resetFilter()">Reset</VBtn>
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

        <template #item.ticketNumber="{ item }">
          <span class="font-weight-medium text-primary cursor-pointer" @click="viewTicket(item.id)">
            {{ item.ticketNumber }}
          </span>
        </template>

        <template #item.companyName="{ item }">
          {{ item.companyName || '-' }}
        </template>

        <template #item.subject="{ item }">
          <div style="max-width: 200px" class="text-truncate">
            {{ item.subject }}
          </div>
        </template>

        <template #item.category="{ item }">
          <VChip size="small" :color="getCategoryColor(item.category)" variant="tonal">
            {{ getCategoryText(item.category) }}
          </VChip>
        </template>

        <template #item.priority="{ item }">
          <VChip size="small" :color="getPriorityColor(item.priority)">
            {{ item.priority }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip size="small" :color="getStatusColor(item.status)">
            {{ getStatusText(item.status) }}
          </VChip>
        </template>

        <template #item.assignedToName="{ item }">
          {{ item.assignedToName || '-' }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <IconBtn size="small" @click="viewTicket(item.id)">
              <VIcon icon="tabler-eye" color="info" />
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

    <!-- Ticket Detail Dialog -->
    <VDialog v-model="detailDialogVisible" max-width="800" scrollable>
      <VCard v-if="selectedTicket">
        <VCardTitle class="d-flex justify-space-between align-center">
          <div>
            <span class="text-h6">{{ selectedTicket.ticketNumber }}</span>
            <VChip size="small" :color="getStatusColor(selectedTicket.status)" class="ms-2">
              {{ getStatusText(selectedTicket.status) }}
            </VChip>
          </div>
          <IconBtn @click="detailDialogVisible = false">
            <VIcon icon="tabler-x" />
          </IconBtn>
        </VCardTitle>

        <VDivider />

        <VCardText style="max-height: 60vh; overflow-y: auto;">
          <div class="mb-4">
            <h6 class="text-h6 mb-2">{{ selectedTicket.subject }}</h6>
            <div class="d-flex flex-wrap gap-4 mb-3">
              <div>
                <span class="text-body-2 text-disabled">Company:</span>
                <span class="ms-1">{{ selectedTicket.companyName || '-' }}</span>
              </div>
              <div>
                <span class="text-body-2 text-disabled">User:</span>
                <span class="ms-1">{{ selectedTicket.userName }} ({{ selectedTicket.userEmail }})</span>
              </div>
              <div>
                <span class="text-body-2 text-disabled">Prioritas:</span>
                <VChip size="x-small" :color="getPriorityColor(selectedTicket.priority)" class="ms-1">
                  {{ selectedTicket.priority }}
                </VChip>
              </div>
              <div>
                <span class="text-body-2 text-disabled">Kategori:</span>
                <VChip size="x-small" :color="getCategoryColor(selectedTicket.category)" class="ms-1" variant="tonal">
                  {{ getCategoryText(selectedTicket.category) }}
                </VChip>
              </div>
            </div>
            <VCard variant="outlined" class="pa-3">
              <p class="text-body-2 mb-0">{{ selectedTicket.description }}</p>
              <p class="text-caption text-disabled mt-2 mb-0">
                {{ dayjs(selectedTicket.createdAt).format('DD/MM/YYYY HH:mm') }}
              </p>
            </VCard>
          </div>

          <VDivider class="my-4" />

          <div v-if="selectedTicket.replies?.length">
            <h6 class="text-h6 mb-3">Balasan ({{ selectedTicket.replies.length }})</h6>
            <div v-for="reply in selectedTicket.replies" :key="reply.id" class="mb-3">
              <VCard :variant="reply.userRole === 'support' ? 'tonal' : 'outlined'" :color="reply.userRole === 'support' ? 'primary' : undefined" class="pa-3">
                <div class="d-flex justify-space-between mb-2">
                  <div class="d-flex align-center gap-2">
                    <VAvatar size="24" :color="reply.userRole === 'support' ? 'primary' : 'secondary'">
                      <span class="text-caption">{{ reply.userName.charAt(0) }}</span>
                    </VAvatar>
                    <span class="font-weight-medium">{{ reply.userName }}</span>
                    <VChip size="x-small" :color="reply.userRole === 'support' ? 'primary' : 'secondary'">
                      {{ reply.userRole === 'support' ? 'Support' : 'Customer' }}
                    </VChip>
                  </div>
                  <span class="text-caption text-disabled">{{ dayjs(reply.createdAt).format('DD/MM/YYYY HH:mm') }}</span>
                </div>
                <p class="text-body-2 mb-0">{{ reply.message }}</p>
              </VCard>
            </div>
          </div>

          <div v-if="selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved'" class="mt-4">
            <h6 class="text-h6 mb-2">Kirim Balasan</h6>
            <AppTextarea
              v-model="replyMessage"
              placeholder="Tulis balasan..."
              rows="3"
            />
          </div>
        </VCardText>

        <VDivider />

        <VCardActions>
          <VBtn
            v-if="selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved'"
            variant="outlined"
            color="error"
            :loading="isLoadingAction"
            @click="handleClose"
          >
            Tutup Ticket
          </VBtn>
          <VSpacer />
          <VBtn variant="outlined" @click="detailDialogVisible = false">Tutup</VBtn>
          <VBtn
            v-if="selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved'"
            color="primary"
            :loading="isLoadingAction"
            :disabled="!replyMessage"
            @click="handleReply"
          >
            Kirim Balasan
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
