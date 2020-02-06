<template>
    <q-page class="flex flex-center">
        <q-table
            table-class="stock-table"
            title="Histórico"
            :data="dataTable"
            :columns="columns"
            row-key="row => `${row.code}-${row.id}`"
            flat
            bordered
            :rows-per-page-options="[25, 50, 100]"
            rows-per-page-label="Items por página"
            :pagination.sync="pagination"
            :visible-columns="visibleColumns"
        >
            <template v-slot:top>
                <h5 style="margin: 0">Histórico</h5>

                <q-space />

                <q-select
                    v-model="visibleColumns"
                    multiple
                    outlined
                    dense
                    options-dense
                    :display-value="$q.lang.table.columns"
                    emit-value
                    map-options
                    :options="columns"
                    option-value="name"
                    options-cover
                    style="min-width: 150px"
                />
            </template>

        </q-table>
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
            pagination: {
                rowsPerPage: 25
            },
            visibleColumns: [ 'code', 'operation', 'date', 'quantity', 'price', 'totalValue' ],
            columns: [
                {
                    name: 'institution',
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
                    sortable: true,
                    format: val => `R$ ${val.toFixed(2).toLocaleString('pt-BR')}`
                },
                {
                    name: 'totalValue',
                    allign: 'right',
                    label: 'Total',
                    field: 'totalValue',
                    sortable: true,
                    format: val => `R$ ${val.toFixed(2).toLocaleString('pt-BR')}`

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
                    account: c.account,
                    id: i
                }))];
                return p;
            }, []);
        });
        ipcRenderer.send('stockHistory/get');
    }
};
</script>

<style lang="scss">
    .stock-table {
        height: 600px;

        table {
            width: 1400px;
            tbody {
                tr:nth-child(odd) {
                    background: #f7f7f7;
                }
            }
        }

    }
</style>
