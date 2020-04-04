<template>
    <q-btn color="white" icon="eva-bell-outline" flat round>
        <q-badge color="red" floating v-show="unreadCount > 0">{{ unreadCount }}</q-badge>
        <q-menu @blur="markRead" ref="menu">
            <q-list style="min-width: 200px; max-width: 300px" class="list">
                <template v-for="(d, i) in data.slice().reverse()">
                    <q-item :key="`item-${i}`" :class="{ read: d.read }">
                        <q-item-section>
                            <q-item-label class="title">{{ d.title }}</q-item-label>
                            <q-item-label caption lines="2">{{ d.message }}</q-item-label>
                        </q-item-section>

                        <q-item-section side top>
                            <q-item-label caption>{{ d.time || 0 }}m</q-item-label>
                            <q-icon class="icon" :name="d.icon" color="primary" />
                            <!-- <q-icon class="icon" v-if="d.type === 'success'" name="eva-checkmark-square-outline" color="green" />
                            <q-icon class="icon" v-if="d.type === 'warning'" name="eva-alert-triangle-outline" color="yellow" />
                            <q-icon class="icon" v-if="d.type === 'error'"   name="eva-alert-circle-outline" color="red" /> -->
                        </q-item-section>
                    </q-item>

                    <q-separator :key="`separator-${i}`" />
                </template>

                <q-item class="flex flex-center" v-if="data.length === 0">
                    <q-item-label style="color: #aaa">Não há notificações</q-item-label>
                </q-item>

                <q-item class="flex flex-center">
                    <q-btn label="LIMPAR" color="primary" dense flat class="q-px-lg" @click="clear" :disable="data.length === 0" />
                </q-item>
            </q-list>
        </q-menu>
    </q-btn>
</template>

<script>
import EventBus from './EventBus';
export default {
    name: 'NotificationPopup',
    props: {
        data: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            updateInterval: null
        };
    },
    methods: {
        markRead() {
            this.data.forEach(d => {
                this.$set(d, 'read', true);
            });
        },
        clear() {
            this.$emit('update:data', []);
            this.$refs.menu.hide();
        }
    },
    computed: {
        unreadCount() {
            return this.data.filter(d => !d.read).length;
        }
    },
    mounted() {
        this.updateInterval = setInterval(() => {
            this.data.forEach(d => {
                if (!d.time)
                    this.$set(d, 'time', 1);
                else
                    d.time++;
            });
        }, 1000 * 60);
    },
    beforeDestroy() {
        clearInterval(this.updateInterval);
    }
};
</script>

<style lang="scss" scoped>
    .list {
        .title {
            font-weight: bold;
        }

        .read {
            background: #eee;
            .title {
                font-weight: normal;
            }
            .icon {
                color: #555 !important;
            }
        }
    }
</style>
