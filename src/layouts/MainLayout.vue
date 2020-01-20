<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          icon="menu"
          aria-label="Menu"
        />

        <q-toolbar-title>
          Quasar App
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
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
        <q-item clickable to="/stocks">
          <q-item-section avatar>
            <q-icon name="eva-bar-chart-2-outline" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Ações</q-item-label>
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

    <NotificationArea :drawerOpen="rightDrawerOpen" />

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import NotificationArea from '../components/NotificationArea'

export default {
  name: 'MainLayout',
  components: {
    NotificationArea
  },
  data () {
    return {
      leftDrawerOpen: false,
      drawerOpen: true
    }
  }
}
</script>
