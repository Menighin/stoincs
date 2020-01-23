<template>
    <q-btn color="white" icon="eva-bell-outline" flat round>
        <q-badge color="red" floating>4</q-badge>
        <q-menu>
            <q-list style="min-width: 100px">
                <q-item clickable v-close-popup>
                    <q-item-section>New tab</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                    <q-item-section>New incognito tab</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup>
                    <q-item-section>Recent tabs</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                    <q-item-section>History</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                    <q-item-section>Downloads</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup>
                    <q-item-section>Settings</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup>
                    <q-item-section>Help &amp; Feedback</q-item-section>
                </q-item>
            </q-list>
        </q-menu>
    </q-btn>
</template>

<script>
export default {
    name: 'NotificationPopup'
}
</script>

<style lang="scss" scoped>

</style>
