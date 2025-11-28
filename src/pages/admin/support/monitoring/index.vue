<script setup lang="ts">
import { useAdminMonitoringStore } from '@/stores/admin/supportStore'

definePage({
  meta: {
    name: 'Admin Monitoring',
    rules: [{ action: 'manage', subject: 'default' }],
  },
})

const monitoringStore = useAdminMonitoringStore()
const { tenantHealth, apiTraffic, systemHealth, isLoading } = storeToRefs(monitoringStore)

onMounted(async () => {
  await monitoringStore.fetchAll()
})

const getHealthColor = (status: string) => {
  const colors: Record<string, string> = {
    healthy: 'success',
    warning: 'warning',
    critical: 'error',
    offline: 'secondary',
    up: 'success',
    down: 'error',
    degraded: 'warning',
  }
  return colors[status] || 'secondary'
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num)
}

// API Traffic Chart Options
const trafficChartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    parentHeightOffset: 0,
  },
  dataLabels: { enabled: false },
  stroke: { curve: 'smooth', width: 2 },
  colors: ['#7367F0', '#EA5455'],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.9,
      opacityFrom: 0.5,
      opacityTo: 0.1,
    },
  },
  xaxis: {
    categories: apiTraffic.value.hourlyData?.map(d => d.hour) || [],
    labels: { style: { fontSize: '10px' } },
  },
  yaxis: {
    labels: { style: { fontSize: '10px' } },
  },
  legend: { position: 'top' },
  tooltip: { shared: true },
}))

const trafficSeries = computed(() => [
  {
    name: 'Requests',
    data: apiTraffic.value.hourlyData?.map(d => d.requests) || [],
  },
  {
    name: 'Errors',
    data: apiTraffic.value.hourlyData?.map(d => d.errors) || [],
  },
])
</script>

<template>
  <div data-testid="admin-monitoring-page">
    <VRow v-if="isLoading">
      <VCol cols="12" class="text-center py-10">
        <VProgressCircular indeterminate color="primary" />
      </VCol>
    </VRow>

    <template v-else>
      <!-- System Health -->
      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>System Health</span>
              <VChip :color="getHealthColor(systemHealth.status)">
                {{ systemHealth.status }}
              </VChip>
            </VCardTitle>
            <VCardText>
              <p class="text-body-2 text-disabled mb-4">Uptime: {{ systemHealth.uptime }}</p>
              
              <VRow>
                <VCol cols="12" md="6">
                  <h6 class="text-h6 mb-3">Services</h6>
                  <VList density="compact">
                    <VListItem
                      v-for="service in systemHealth.services"
                      :key="service.name"
                    >
                      <template #prepend>
                        <VIcon
                          :icon="service.status === 'up' ? 'tabler-circle-check' : service.status === 'degraded' ? 'tabler-alert-circle' : 'tabler-circle-x'"
                          :color="getHealthColor(service.status)"
                          size="20"
                        />
                      </template>
                      <VListItemTitle>{{ service.name }}</VListItemTitle>
                      <template #append>
                        <span class="text-body-2 text-disabled">{{ service.responseTime }}ms</span>
                      </template>
                    </VListItem>
                  </VList>
                </VCol>
                <VCol cols="12" md="6">
                  <h6 class="text-h6 mb-3">Resources</h6>
                  <div class="d-flex flex-column gap-4">
                    <div>
                      <div class="d-flex justify-space-between mb-1">
                        <span class="text-body-2">CPU</span>
                        <span class="text-body-2">{{ systemHealth.resources?.cpu }}%</span>
                      </div>
                      <VProgressLinear
                        :model-value="systemHealth.resources?.cpu"
                        :color="(systemHealth.resources?.cpu || 0) > 80 ? 'error' : 'primary'"
                        height="8"
                        rounded
                      />
                    </div>
                    <div>
                      <div class="d-flex justify-space-between mb-1">
                        <span class="text-body-2">Memory</span>
                        <span class="text-body-2">{{ systemHealth.resources?.memory }}%</span>
                      </div>
                      <VProgressLinear
                        :model-value="systemHealth.resources?.memory"
                        :color="(systemHealth.resources?.memory || 0) > 80 ? 'error' : 'success'"
                        height="8"
                        rounded
                      />
                    </div>
                    <div>
                      <div class="d-flex justify-space-between mb-1">
                        <span class="text-body-2">Disk</span>
                        <span class="text-body-2">{{ systemHealth.resources?.disk }}%</span>
                      </div>
                      <VProgressLinear
                        :model-value="systemHealth.resources?.disk"
                        :color="(systemHealth.resources?.disk || 0) > 80 ? 'error' : 'warning'"
                        height="8"
                        rounded
                      />
                    </div>
                    <div>
                      <div class="d-flex justify-space-between mb-1">
                        <span class="text-body-2">Network</span>
                        <span class="text-body-2">{{ systemHealth.resources?.network }}%</span>
                      </div>
                      <VProgressLinear
                        :model-value="systemHealth.resources?.network"
                        color="info"
                        height="8"
                        rounded
                      />
                    </div>
                  </div>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- API Traffic -->
      <VRow class="mt-4">
        <VCol cols="12" lg="8">
          <VCard>
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>API Traffic (24 Jam)</span>
              <div class="d-flex gap-4">
                <div class="text-center">
                  <p class="text-h6 mb-0">{{ formatNumber(apiTraffic.totalRequests || 0) }}</p>
                  <p class="text-caption text-disabled mb-0">Total Requests</p>
                </div>
                <div class="text-center">
                  <p class="text-h6 mb-0 text-success">{{ apiTraffic.successRate }}%</p>
                  <p class="text-caption text-disabled mb-0">Success Rate</p>
                </div>
                <div class="text-center">
                  <p class="text-h6 mb-0">{{ apiTraffic.averageResponseTime }}ms</p>
                  <p class="text-caption text-disabled mb-0">Avg Response</p>
                </div>
              </div>
            </VCardTitle>
            <VCardText>
              <VueApexCharts
                type="area"
                height="300"
                :options="trafficChartOptions"
                :series="trafficSeries"
              />
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12" lg="4">
          <VCard>
            <VCardTitle>Top Endpoints</VCardTitle>
            <VCardText>
              <VList density="compact">
                <VListItem
                  v-for="(endpoint, idx) in apiTraffic.endpointStats"
                  :key="idx"
                >
                  <VListItemTitle class="text-body-2">
                    <code>{{ endpoint.endpoint }}</code>
                  </VListItemTitle>
                  <VListItemSubtitle>
                    {{ formatNumber(endpoint.calls) }} calls · {{ endpoint.avgTime }}ms avg
                  </VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- Tenant Health -->
      <VRow class="mt-4">
        <VCol cols="12">
          <VCard>
            <VCardTitle>Tenant Health Status</VCardTitle>
            <VCardText>
              <VDataTable
                :headers="[
                  { title: 'Company', key: 'companyName' },
                  { title: 'Status', key: 'status' },
                  { title: 'API Calls', key: 'metrics.apiCalls', align: 'end' },
                  { title: 'Error Rate', key: 'metrics.errorRate', align: 'end' },
                  { title: 'Avg Response', key: 'metrics.responseTime', align: 'end' },
                  { title: 'Active Users', key: 'metrics.activeUsers', align: 'end' },
                ]"
                :items="tenantHealth"
                class="text-no-wrap"
              >
                <template #item.status="{ item }">
                  <VChip size="small" :color="getHealthColor(item.status)">
                    {{ item.status }}
                  </VChip>
                </template>
                <template #item.metrics.apiCalls="{ item }">
                  {{ formatNumber(item.metrics.apiCalls) }}
                </template>
                <template #item.metrics.errorRate="{ item }">
                  <span :class="item.metrics.errorRate > 2 ? 'text-error' : ''">
                    {{ item.metrics.errorRate }}%
                  </span>
                </template>
                <template #item.metrics.responseTime="{ item }">
                  <span :class="item.metrics.responseTime > 500 ? 'text-warning' : ''">
                    {{ item.metrics.responseTime }}ms
                  </span>
                </template>
              </VDataTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/libs/apex-chart";
</style>
