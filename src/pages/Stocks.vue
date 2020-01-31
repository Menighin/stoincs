<template>
    <q-page class="flex flex-center">
        <h5>Work in progress</h5>
        {{ dataTable }}
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';

export default {
    name: 'PageStocks',
    data() {
        return {
            data: [],
            dataTable: []
        };
    },
    methods: {
    },
    mounted() {
        const self = this;
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            self.data = arg;
            self.dataTable = arg.reduce((p, c, i) => {
                p = [...p, ...c.stockHistory.map(s => ({
                    ...s,
                    institution: c.institution,
                    account: c.account
                }))];
                return p;
            }, []);
        });
        ipcRenderer.send('stockHistory/get', 'ping');
    }
};
</script>
