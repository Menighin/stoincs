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
                    :icon="userInfo === null ? 'eva-google' : undefined">
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
                                    <q-btn
                                        dense
                                        flat
                                        color="primary"
                                        size="10px"
                                        icon="eva-cloud-download-outline"
                                        @click="downloadFiles"
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
            :width="230"
            :breakpoint="500"
            content-class="bg-grey-2"
        >
            <q-list id="menu-list">
                <q-expansion-item
                    expand-separator
                    label="Ações"
                    icon="fas fa-wallet"
                    class="expansion-item q-router-link--active"
                    :content-inset-level="1">
                    <q-list>
                        <q-item clickable @click="navigate('/prices', $event)">Preços</q-item>
                        <q-item clickable @click="navigate('/wallet', $event)">Carteira</q-item>
                        <q-item clickable @click="navigate('/consolidated', $event)">Consolidado</q-item>
                        <q-item clickable @click="navigate('/stock-history', $event)">Extrato</q-item>
                        <q-item clickable @click="navigate('/wallet-charts', $event)">Gráficos</q-item>
                    </q-list>
                </q-expansion-item>
                <q-expansion-item
                    expand-separator
                    label="Tesouro Direto"
                    icon="fas fa-landmark"
                    class="expansion-item q-router-link--active"
                    :content-inset-level="1">
                    <q-list>
                        <q-item clickable @click="navigate('/treasury-direct-wallet', $event)">Carteira</q-item>
                        <q-item clickable @click="navigate('/treasury-direct-wallet-chart', $event)">Gráficos</q-item>
                    </q-list>
                </q-expansion-item>
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

        <q-page-container class="page-container">
            <router-view />
            <!-- <q-btn color="secondary" @click="notify">Notify</q-btn> -->
        </q-page-container>
        <snout-loader @touchSnout="touchSnout" class="snout-loader" ref="snoutLoader"></snout-loader>

        <q-dialog v-model="newVersionDialog" persistent>
            <q-card style="min-width: 450px;">
                <q-card-section class="row q-ma-sm flex flex-center" style="padding-bottom: 0">
                    <inline-svg
                        src="img/snout.svg"
                        fill="black"
                        style="transform: scale(1);"
                        aria-label="Porquinho Digital Logo"
                    ></inline-svg>
                </q-card-section>
                <q-card-section class="row q-ma-sm flex flex-center" style="padding-top: 0">
                    <div class="q-mt-md text-center">
                        Nova versão do <strong>Porquinho Digital</strong> baixada! Deseja instalar agora?
                    </div>
                </q-card-section>
                <q-separator />
                <q-card-actions align="right">
                    <q-btn color="primary" flat @click="newVersionDialog = false">Não</q-btn>
                    <q-btn color="primary" flat @click="installUpdate">Sim</q-btn>
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-layout>
</template>

<script>
import NotificationPopup from '../components/NotificationPopup';
import { ipcRenderer } from 'electron';
import DateUtils from '../../src-electron/utils/DateUtils';
import SnoutLoader from '../components/SnoutLoader';
import EventBus from '../components/EventBus';
import InlineSvg from 'vue-inline-svg';

let notifyId = 0;

export default {
    name: 'MainLayout',
    components: {
        NotificationPopup,
        SnoutLoader,
        InlineSvg
    },
    data() {
        return {
            leftDrawerOpen: false,
            miniState: true,
            notificationOpen: false,
            userInfo: null,
            isUploadingToGoogle: false,
            lastGoogleUpload: null,
            notifications: [],
            newVersionDialog: false,
            newVersion: ''
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
                cancel: {
                    label: 'Não',
                    flat: true
                },
                ok: {
                    label: 'Sim',
                    flat: true
                },
                persistent: false
            }).onOk(data => {
                ipcRenderer.send('google-drive/logout', { clearData: data.length > 0 });
            });
        },
        uploadToGoogle() {
            this.isUploadingToGoogle = true;
            ipcRenderer.send('google-drive/upload');
        },
        downloadFiles() {
            ipcRenderer.send('files/download');
        },
        navigate(path, event) {
            const element = event.currentTarget;
            const allMenus = element.closest('#menu-list').querySelectorAll('.q-item');
            const parentMenu = element.closest('.expansion-item');

            allMenus.forEach(menu => menu.classList.remove('q-router-link--active'));

            element.classList.add('q-router-link--active');
            if (parentMenu !== null)
                parentMenu.querySelector('.q-item').classList.add('q-router-link--active');

            const currentPath = this.$router.currentRoute.path;

            if (currentPath === '/') {
                setTimeout(() => this.$router.push(path), 700);
                setTimeout(() => EventBus.$emit('snout-loader-show'), 700);
                document.getElementById('logo-svg').classList.remove('bounce-in');
                document.getElementById('logo-svg').classList.add('bounce-out');
            } else {
                this.$router.push(path);
            }
        },
        installUpdate() {
            ipcRenderer.send('auto-update/install');
        },
        touchSnout() {
            console.log('oinc');
            this.$router.push('/?snoutState=hidden');
            EventBus.$emit('snout-loader-hide');
        }
    },
    mounted() {
        ipcRenderer.on('notification/message', (event, response) => {
            this.notifications.push(response.data);
        });

        ipcRenderer.on('notification/log', (event, response) => {
            console.log('Log', response);
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
                cancel: {
                    label: 'Não',
                    flat: true
                },
                ok: {
                    label: 'Sim',
                    flat: true
                },
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

        ipcRenderer.on('auto-update/progress-download', (event, response) => {
            this.$snout.updateProgress(parseFloat(response.percent / 100));
        });

        ipcRenderer.on('auto-update/finish-download', (event, response) => {
            this.newVersion = response;
            this.$snout.finishProgress();
            setTimeout(() => {
                this.newVersionDialog = true;
            }, 500);
        });

        ipcRenderer.send('google-drive/auto-login');
    }
};
</script>

<style lang="scss" scoped>
    .snout-loader {
        position: fixed;
        bottom: 8px;
        right: 16px;
    }

    .page-container {
        background: #fbfbfb;
    }
</style>
