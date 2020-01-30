<template>
    <q-page class="flex flex-center">
        <h5>Work in progress</h5>
        {{ data }}
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';

export default {
    name: 'PageStocks',
    data() {
        return {
            data: []
        };
    },
    methods: {
    },
    mounted() {
        const self = this;
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            console.log(arg);
            self.data = arg;
        });
        ipcRenderer.send('stockHistory/get', 'ping');
    }
};
</script>
