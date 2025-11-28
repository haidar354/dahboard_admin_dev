export default [
  {
    title: 'Dashboard',
    icon: { icon: 'tabler-home' },
    to: 'sales-dashboard',
    rules: [
      {
        action: 'manage',
        subject: 'default',
      },
    ],
  },
  {
    title: 'Data Penjualan',
    icon: { icon: 'tabler-chart-bar' },
    to: 'sales-orders',
    rules: [
      {
        action: 'manage',
        subject: 'default',
      },
    ],
  },
]
