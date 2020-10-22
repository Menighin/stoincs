const fs = require('fs');
const os = require('os');

const beforeBuild = async () => {
    const about = {
        buildDate: new Date(),
        machine: os.hostname()
    };
    await fs.promises.writeFile('./src-electron/resources/AboutStoincs.js', `export default ${JSON.stringify(about)}`);
};

module.exports = function(ctx) {
    return {
        supportTS: false,
        boot: [
        ],
        css: [
            'app.scss'
        ],
        extras: [
            'fontawesome-v5',
            'eva-icons',
            'roboto-font',
            'material-icons'
        ],
        framework: {
            iconSet: 'material-icons',
            lang: 'en-us',
            importStrategy: 'auto',
            plugins: [
                'Notify', 'Dialog', 'Loading'
            ]
        },
        build: {
            vueRouterMode: 'hash',
            extendWebpack(cfg) {
                cfg.module.rules.push({
                    enforce: 'pre',
                    test: /\.(js|vue)$/,
                    loader: 'eslint-loader',
                    exclude: /node_modules/
                });
            },
            async beforeDev() {
                await beforeBuild();
            },
            async beforeBuild() {
                await beforeBuild();
            }
        },
        devServer: {
            https: false,
            port: 8080,
            open: true
        },
        animations: 'all',
        ssr: {
            pwa: false
        },
        pwa: {
            workboxPluginMode: 'GenerateSW',
            workboxOptions: {},
            manifest: {
                name: 'Stoincs',
                short_name: 'Stoincs',
                description: 'Acompanhe seus investimentos',
                display: 'standalone',
                orientation: 'portrait',
                background_color: '#ffffff',
                theme_color: '#027be3',
                icons: [
                    {
                        'src': 'icons/icon-128x128.png',
                        'sizes': '128x128',
                        'type': 'image/png'
                    },
                    {
                        'src': 'icons/icon-192x192.png',
                        'sizes': '192x192',
                        'type': 'image/png'
                    },
                    {
                        'src': 'icons/icon-256x256.png',
                        'sizes': '256x256',
                        'type': 'image/png'
                    },
                    {
                        'src': 'icons/icon-384x384.png',
                        'sizes': '384x384',
                        'type': 'image/png'
                    },
                    {
                        'src': 'icons/icon-512x512.png',
                        'sizes': '512x512',
                        'type': 'image/png'
                    }
                ]
            }
        },
        cordova: {
        },
        capacitor: {
            hideSplashscreen: true
        },
        electron: {
            bundler: 'builder',
            builder: {
                appId: 'stoincs',
                copyright: 'Copyright © 2020 Stoincs',
                productName: 'Stoincs',
                win: {
                    icon: 'src-electron/icons/icon.png',
                    target: 'nsis'
                },
                linux: {
                    target: [
                        'rpm'
                    ]
                },
                publish: {
                    provider: 'github'
                },
                asar: true
            },
            nodeIntegration: true,
            extendWebpack(cfg) {
            }
        }
    };
};
