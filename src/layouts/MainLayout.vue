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

                <NotificationPopup />

                <q-btn
                    class="q-mx-sm"
                    v-if="userInfo === null"
                    flat
                    dense
                    round
                    @click="login"
                    icon="eva-google-outline"
                />

                <q-btn round v-if="userInfo !== null" class="q-mx-sm">
                    <q-avatar size="32px">
                        <img :src="userInfo.photo">
                    </q-avatar>
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
            <q-list>
                <q-item clickable to="/">
                    <q-item-section avatar>
                        <q-icon name="eva-home-outline" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Inicio</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item clickable to="/wallet">
                    <q-item-section avatar>
                        <q-icon name="eva-bar-chart" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Carteira</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item clickable to="/stock-history">
                    <q-item-section avatar>
                        <q-icon name="eva-book-open-outline" />
                    </q-item-section>
                    <q-item-section>
                        <q-item-label>Negociações</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item clickable to="/configurations">
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
        </q-page-container>
    </q-layout>
</template>

<script>
import NotificationPopup from '../components/NotificationPopup';
import { ipcRenderer } from 'electron';

export default {
    name: 'MainLayout',
    components: {
        NotificationPopup
    },
    data() {
        return {
            leftDrawerOpen: false,
            miniState: true,
            notificationOpen: false,
            userInfo: null
        };
    },
    methods: {
        login() {
            ipcRenderer.send('google-drive/login');
        }
    },
    mounted() {
        ipcRenderer.on('notification/login-success', (event, response) => {
            console.log(response);
            if (response.status === 'success') {
                console.log('oi');
                this.userInfo = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao tentar logar: ${response.error.message}` });
                console.error(response.error);
            }
        });
    }
};
</script>
