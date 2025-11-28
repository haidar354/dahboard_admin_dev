<script setup lang="ts">
import dayjs from 'dayjs'
import { onMounted, ref, watch } from 'vue'
import { type VDataTable, VDataTableServer } from 'vuetify/lib/components/index.mjs'
import { useDisplay } from 'vuetify/lib/framework.mjs'

import { useCursorTargetMenu } from '@/composables/utils/useCursorMenu'
import { useOrderStore } from '@/stores/sales/orderStore'
import type { Order } from '@/types/models/sales/order'
import OrderDetailDialog from '@/views/pages/sales/orders/OrderDetailDialog.vue'
import OrderDialog from '@/views/pages/sales/orders/OrderDialog.vue'

definePage({
  meta: {
    name: 'Transaksi Penjualan',
    rules: [
      {
        action: 'manage',
        subject: 'default',
      },
    ],
  },
})

type ReadonlyHeaders = VDataTable['$props']['headers']
const orderStore = useOrderStore()
const search = ref('')

const {
  paginateData,
  isLoadingFetchData,
  requestQuery,
  selectedOrder,
} = storeToRefs(orderStore)

const { smAndDown } = useDisplay()

const headers: ReadonlyHeaders = [
  { title: 'NO', key: 'index', align: 'start', width: '5%', sortable: false },
  { title: 'Kode Transaksi', key: 'orderCode', align: 'start' },
  { title: 'Pelanggan', key: 'customerName', align: 'start' },
  { title: 'Total', key: 'grandTotal', align: 'end' },
  { title: 'Status', key: 'status', align: 'center', sortable: false },
  { title: 'Outlet', key: 'outlet.name', align: 'start' },
  { title: 'Tanggal Buat', key: 'createdAt', align: 'start', width: '12%' },
  { title: 'Aksi', key: 'actions', align: 'center', width: '10%', sortable: false },
]

const { isOpen, target, openFromEvent, onAfterLeave } = useCursorTargetMenu()

const onRowClick = (item: Order, event: MouseEvent | PointerEvent) => {
  selectedOrder.value = item
  openFromEvent(event)
}

watch(search, customDebounce((newValue: string) => {
  requestQuery.value.search = newValue
}, 500))

const fetchPaginate = async () => {
  await orderStore.fetchPaginate({
    include: ['outlet', 'salesChannel'],
  })
}

onMounted(async () => {
  await fetchPaginate()
  if (requestQuery.value?.search)
    search.value = requestQuery.value.search
})

// Re-fetch on query changes
watch(
  () => requestQuery.value,
  async () => {
    await fetchPaginate()
  },
  { deep: true },
)
</script>

<template>
  <OrderDialog />
  <OrderDetailDialog />
  <div>
    <VCard>
      <VCardText class="d-flex flex-wrap justify-space-between">
        <span class="text-h5 d-inline my-auto">
          Data Transaksi Penjualan
        </span>
        <div class="mt-3 mt-md-0 flex-fill">
          <div class="w-auto d-flex flex-wrap justify-end" />
        </div>
      </VCardText>

      <VDivider />

      <VCardText>
        <VRow>
          <VCol
            cols="12"
            class="d-flex flex-row flex-wrap"
          >
            <VAutocomplete
              v-model="requestQuery.perPage"
              :items="perPages"
              hide-details
              dense
              outlined
              style="max-inline-size: 8rem; min-inline-size: 5rem;"
            />
            <VSpacer />

            <AppTextField
              v-model="search"
              class="ms-0 ms-sm-3 mt-3 mt-sm-0 flex-1-1-100 flex-sm-fill"
              placeholder="Cari kode atau nama pelanggan..."
              append-inner-icon="tabler-search"
              single-line
              hide-details
              dense
              outlined
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDataTableServer
        :headers="headers"
        :items="paginateData.data"
        :loading="isLoadingFetchData"
        loading-text="Memuat data..."
        class="text-no-wrap"
        :items-per-page="requestQuery.perPage"
        :items-length="paginateData.meta?.total || 0"
        :sort-by="[{ key: requestQuery.orderField || '', order: requestQuery.orderDirection || 'asc' }]"
        @update:page="requestQuery.page = $event"
        @update:sort-by="orderStore.onSortBy"
      >
        <template #item="{ index, item }">
          <tr
            class="cursor-pointer"
            @click="onRowClick(item, $event)"
            @contextmenu.prevent="openFromEvent"
          >
            <td>{{ (paginateData.meta?.from || 0) + index }}</td>
            <td>
              <div class="text-wrap">
                <strong>{{ item.orderCode }}</strong>
              </div>
            </td>
            <td>
              <span>{{ item.customerName || 'Umum' }}</span>
            </td>
            <td class="text-end">
              {{ formatRupiah(item.grandTotal) }}
            </td>
            <td class="text-center">
              <VChip
                :color="item.status === 'PAID' ? 'success' : item.status === 'VOID' ? 'error' : 'warning'"
                size="small"
                rounded
                class="text-uppercase font-weight-medium"
              >
                {{ item.status }}
              </VChip>
            </td>
            <td>
              <span>{{ item.outlet?.name || '-' }}</span>
            </td>
            <td>
              {{ dayjs(item.createdAt).format('DD-MM-YYYY HH:mm') }}
            </td>
            <td class="text-center">
              <VBtn
                icon="tabler-dots-vertical"
                variant="text"
                @click="onRowClick(item, $event)"
                @contextmenu.prevent="openFromEvent"
              />
            </td>
          </tr>
        </template>

        <!-- No Data -->
        <template #no-data>
          <VAlert
            dense
            color="light-secondary"
          >
            <VIcon>tabler-alert-triangle</VIcon>
            <div>Data transaksi tidak tersedia</div>
          </VAlert>
        </template>

        <!-- Pagination -->
        <template #bottom>
          <VCardText class="pt-2">
            <div class="d-flex flex-wrap justify-end mt-2">
              <VPagination
                v-model="requestQuery.page"
                :total-visible="smAndDown ? 3 : 5"
                :length="paginateData.meta?.lastPage || 0"
              />
            </div>
          </VCardText>
        </template>
      </VDataTableServer>
      <VMenu
        v-model="isOpen"
        :target="target"
        location="bottom start"
        location-strategy="connected"
        scroll-strategy="reposition"
        :offset="0"
        :close-on-content-click="true"
        @after-leave="onAfterLeave"
      >
        <VList
          v-if="selectedOrder"
          class="py-2"
        >
          <VListItem
            title="Detail"
            prepend-icon="tabler-eye"
            @click="orderStore.showDetailDialog(selectedOrder.orderId)"
          />
          <VListItem
            title="Hapus"
            prepend-icon="tabler-trash"
            @click="orderStore.onDeleteItem(selectedOrder)"
          />
        </VList>
      </VMenu>
    </VCard>
  </div>
</template>
