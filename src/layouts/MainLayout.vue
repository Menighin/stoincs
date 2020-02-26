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

export default {
    name: 'MainLayout',
    components: {
        NotificationPopup
    },
    data() {
        return {
            leftDrawerOpen: false,
            miniState: true,
            notificationOpen: false
        };
    }
};
</script>
