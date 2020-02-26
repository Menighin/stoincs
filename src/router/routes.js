
const routes = [
    {
        path: '/',
        component: () => import('layouts/MainLayout.vue'),
        children: [
            { path: '', component: () => import('pages/Index.vue') },
            { path: '/configurations', component: () => import('pages/Configurations.vue') },
            { path: '/stock-history', component: () => import('pages/StockHistory.vue') },
            { path: '/wallet', component: () => import('pages/Wallet.vue') }
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
