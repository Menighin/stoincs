<template>
    <q-page class="flex flex-center">
        <q-table
            class="my-sticky-header-table"
            title="Histórico"
            :data="dataTable"
            :columns="columns"
            row-key="name"
            flat
            bordered
        />
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';

export default {
    name: 'PageStocks',
    data() {
        return {
            data: [],
            dataTable: [],
            columns: [
                {
                    name: 'institution',
                    required: true,
                    label: 'Instituição',
                    align: 'left',
                    field: 'institution',
                    format: val => `${val}`,
                    sortable: true
                },
                {
                    name: 'account',
                    align: 'left',
                    label: 'Conta',
                    field: 'account',
                    sortable: true
                },
                {
                    name: 'code',
                    align: 'center',
                    label: 'Ativo',
                    field: 'code',
                    sortable: true
                },
                {
                    name: 'operation',
                    align: 'center',
                    label: 'Operação',
                    field: 'operation',
                    sortable: true
                },
                {
                    name: 'date',
                    align: 'center',
                    label: 'Data',
                    field: 'date',
                    sortable: true,
                    format: val => {
                        const d = new Date(val);
                        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                    }
                },
                {
                    name: 'quantity',
                    allign: 'right',
                    label: 'Quantidade',
                    field: 'quantity',
                    sortable: true
                },
                {
                    name: 'price',
                    allign: 'right',
                    label: 'Preço',
                    field: 'price',
                    sortable: true
                },
                {
                    name: 'totalValue',
                    allign: 'right',
                    label: 'Total',
                    field: 'totalValue',
                    sortable: true
                }
            ]
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
