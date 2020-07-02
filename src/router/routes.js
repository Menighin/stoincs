
const routes = [
    {
        path: '/',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            { path: '', component: () => import('pages/Index.vue') },
            { path: '/configurations', component: () => import('pages/Configurations.vue') },
            { path: '/stock-history', component: () => import('pages/StockHistory.vue') },
            { path: '/consolidated', component: () => import('pages/Consolidated.vue') },
            { path: '/prices', component: () => import('pages/Prices.vue') },
            { path: '/wallet', component: () => import('pages/Wallet.vue') },
            { path: '/wallet-charts', component: () => import('pages/WalletCharts.vue') },
            { path: '/treasury-direct-wallet', component: () => import('pages/TreasuryDirectWallet.vue') },
            { path: '/treasury-direct-wallet-chart', component: () => import('pages/TreasuryDirectWalletChart.vue') }
        ]
    }
];

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
    routes.push({
        path: '*',
        component: () => import('pages/Error404.vue')
    });
}

export default routes;
