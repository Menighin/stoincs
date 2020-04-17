<template>
    <q-layout view="hHh LpR lFf">
        <q-header elevated>
            <q-toolbar>
                <q-btn
                    flat
                    dense
                    round
                    @click="leftDrawerOpen = !leftDrawerOpen"
                    icon="eva-menu-outline"
                    aria-label="Menu"
                />

                <q-toolbar-title>
                    Porquinho Digital
                </q-toolbar-title>

                <NotificationPopup :data.sync="notifications" />

                <q-btn
                    round
                    class="q-mx-sm"
                    :icon="userInfo === null ? 'eva-google-outline' : undefined">
                    <q-avatar size="32px" v-if="userInfo !== null">
                        <img :src="userInfo.photo">
                    </q-avatar>
                    <q-menu>
                        <div class="row no-wrap q-pa-md">
                            <div class="column items-center" style="width: 200px" v-if="userInfo !== null">

                                <div style="text-align: right; width: 100%">
                                    <q-btn
                                        dense
                                        flat
                                        color="primary"
                                        size="10px"
                                        icon="eva-sync-outline"
                                        :disable="isUploadingToGoogle"
                                        @click="uploadToGoogle"
                                    ></q-btn>
                                </div>

                                <q-avatar size="72px">
                                    <img :src="userInfo.photo">
                                </q-avatar>

                                <div class="text-subtitle1 q-mt-md q-mb-xs">{{ userInfo.name }}</div>

                                <q-btn
                                    @click="logout"
                                    color="primary"
                                    label="Logout"
                                    size="sm"
                                    v-close-popup
                                />

                                <div style="font-size: 10px; color: #888;" class="q-mt-sm" v-if="lastGoogleUpload !== null">
                                    Última sincronização: {{ lastGoogleUpload }}
                                </div>
                            </div>
                            <div class="column items-center" v-if="userInfo === null">
                                <q-btn
                                    @click="login"
                                    color="primary"
                                    label="Login com Google"
                                    size="sm"
                                    v-close-popup
                                />
                            </div>
                        </div>
                    </q-menu>
                </q-btn>

            </q-toolbar>
        </q-header>

        <q-drawer
            v-model="leftDrawerOpen"
            bordered
            show-if-above
            :mini="miniState"
            @mouseover="miniState = false"
            @mouseout="miniState = true"
            mini-to-overlay
            :width="200"
            :breakpoint="500"
            content-class="bg-grey-2"
        >
            <q-list id="menu-list">
                <q-expansion-item
                    expand-separator
                    label="Carteira"
                    icon="eva-bar-chart"
                    :content-inset-level="1">
                    <q-list>
                        <q-item clickable @click="navigate('/wallet', $event)">Dados</q-item>
                        <q-item clickable @click="navigate('/wallet-charts', $event)">Gráficos</q-item>
                    </q-list>
                </q-expansion-item>
                <q-item clickable @click="navigate('/stock-history', $event)">
                    <q-item-section avatar>
                        <q-icon name="eva-book-open-outline" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Negociações</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item clickable @click="navigate('/configurations', $event)">
                    <q-item-section avatar>
                        <q-icon name="eva-settings-2-outline" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Configurações</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>
        </q-drawer>

        <q-page-container>
            <router-view />
            <!-- <q-btn color="secondary" @click="notify">Notify</q-btn> -->
        </q-page-container>
        <snout-loader class="snout-loader"></snout-loader>
    </q-layout>
</template>

<script>
import NotificationPopup from '../components/NotificationPopup';
import { ipcRenderer } from 'electron';
import DateUtils from '../../src-electron/utils/DateUtils';
import SnoutLoader from '../components/SnoutLoader';
import EventBus from '../components/EventBus';

let notifyId = 0;

export default {
    name: 'MainLayout',
    components: {
        NotificationPopup,
        SnoutLoader
    },
    data() {
        return {
            leftDrawerOpen: false,
            miniState: true,
            notificationOpen: false,
            userInfo: null,
            isUploadingToGoogle: false,
            lastGoogleUpload: null,
            notifications: []
        };
    },
    methods: {
        notify() {
            let evt = {
                code: `evt-${notifyId}`,
                message: `Testing ${notifyId}`
            };
            EventBus.$emit('snout-loader-start', evt);
            setTimeout(() => {
                ((id) => {
                    EventBus.$emit('snout-loader-finish', id);
                })(evt.code);
            }, 6000);
            notifyId++;
        },
        login() {
            if (this.userInfo !== null) return;
            ipcRenderer.send('google-drive/login');
        },
        logout() {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Tem certeza que deseja fazer logout?',
                options: {
                    type: 'checkbox',
                    model: [],
                    items: [
                        { label: 'Apagar arquivos da nuvem', value: 'clearData' }
                    ]
                },
                cancel: true,
                persistent: false
            }).onOk(data => {
                ipcRenderer.send('google-drive/logout', { clearData: data.length > 0 });
            });
        },
        uploadToGoogle() {
            this.isUploadingToGoogle = true;
            ipcRenderer.send('google-drive/upload');
        },
        navigate(path, event) {
            const element = event.currentTarget;
            const list = element.parentElement.children;

            for (const item of list)
                item.classList.remove('q-router-link--active');

            element.classList.add('q-router-link--active');

            const currentPath = this.$router.currentRoute.path;

            if (currentPath === '/') {
                setTimeout(() => this.$router.push(path), 700);
                setTimeout(() => EventBus.$emit('snout-loader-show'), 700);
                document.getElementById('logo-svg').classList.add('bounce-out');
            } else {
                this.$router.push(path);
            }
        }
    },
    mounted() {
        ipcRenderer.on('notification/message', (event, response) => {
            this.notifications.push(response.data);
            console.log(response);
        });

        ipcRenderer.on('notification/start-loading', (event, response) => {
            this.$snout.start(response.data);
        });

        ipcRenderer.on('notification/finish-loading', (event, response) => {
            this.$snout.finish(response.data);
        });

        ipcRenderer.on('notification/login-success', (event, response) => {
            if (response.status === 'success') {
                this.userInfo = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao tentar logar: ${response.message}` });
                console.log(response);
            }
        });

        ipcRenderer.on('google-drive/login', (event, response) => {
            if (response.status === 'error') {
                this.$q.notify({ type: 'negative', message: `Error ao tentar logar: ${response.message}` });
                console.log(response);
            }
        });

        ipcRenderer.on('google-drive/auto-login', (event, response) => {
            if (response.status === 'error') {
                this.$q.notify({ type: 'negative', message: `Error ao tentar logar: ${response.message}` });
                console.log(response);
            }
        });

        ipcRenderer.on('google-drive/logout', (event, response) => {
            if (response.status === 'success') {
                this.userInfo = null;
                this.$q.notify({ type: 'positive', message: `Logout realizado com sucesso` });
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao tentar deslogar: ${response.message}` });
            }
        });

        ipcRenderer.on('google-drive/upload', (event, response) => {
            this.isUploadingToGoogle = false;
            this.lastGoogleUpload = DateUtils.toString(new Date());
            if (response.status === 'error') {
                this.$q.notify({ type: 'negative', message: `Error ao sincronizar dados com Google Drive: ${response.message}` });
            }
        });

        ipcRenderer.on('google-drive/ask-download', (event, response) => {
            this.$q.dialog({
                title: 'Baixar do Google Drive?',
                message: 'Existem arquivos no Google Drive. Deseja substituir seus arquivos locais pelos que estão na nuvem? CUIDADO! Caso você opte por não baixar os arquivos da nuvem, estes podem ser apagados quando sincronizados automaticamente',
                cancel: true,
                persistent: true
            }).onOk(() => {
                ipcRenderer.send('google-drive/download');
            });
        });

        ipcRenderer.on('app/quiting', (event, response) => {
            this.$q.loading.show({
                message: 'Atualizando <b>Google Drive</b>...'
            });
        });

        ipcRenderer.send('google-drive/auto-login');
    }
};
</script>

<style lang="scss" scoped>
    .snout-loader {
        position: absolute;
        bottom: 8px;
        right: 16px;
    }
</style>
