<template>
    <q-page class="flex flex-center">
        <div class="column q-px-md q-py-sm" style="width: 80%">
            <div class="filter">
                <q-btn outline color="primary" :label="selectedMonth" class="q-ma-lg" icon="eva-calendar-outline">
                    <q-menu fit>
                        <q-list style="min-width: 100px">
                            <q-item @click="selectedMonth = month" clickable v-close-popup v-for="(month, i) in months" :key="`month-${i}`">
                                <q-item-section>{{ month }}</q-item-section>
                            </q-item>
                        </q-list>
                    </q-menu>
                </q-btn>
            </div>

            <div class="row q-ma-sm justify-between items-center">
                <q-card class="kpis-card" flat bordered>
                    <q-card-section horizontal>
                        <q-card-section>
                            Loren ipsum
                        </q-card-section>

                        <q-separator vertical />

                        <q-card-section>
                            Loren ipsum
                        </q-card-section>
                    </q-card-section>
                </q-card>
            </div>

            <div class="row q-ma-sm justify-between items-center">
                <q-table
                    class="table-container"
                    table-class="stock-table"
                    title="Histórico"
                    :data="filteredDataTable"
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
            </div>
        </div>
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
            months: ['Todos', '08/2018', '09/2018'],
            selectedMonth: 'Todos',
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
                        return `${val.getDate().toString().padStart(2, '0')}/${(val.getMonth() + 1).toString().padStart(2, '0')}/${val.getFullYear()}`;
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
                    format: val => `R$ ${val.toFixed(2).toLocaleString('pt-br')}`
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
    computed: {
        filteredDataTable() {
            if (this.selectedMonth === 'Todos') {
                return this.dataTable;
            } else {
                const [month, year] = this.selectedMonth.split('/').map(s => parseInt(s));
                return this.dataTable.filter(d => {
                    return d.date.getMonth() + 1 === month && d.date.getFullYear() === year;
                });
            }
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            this.data = arg;
            this.dataTable = arg.reduce((p, c, i) => {
                p = [...p, ...c.stockHistory.map(s => ({
                    ...s,
                    date: new Date(s.date),
                    institution: c.institution,
                    account: c.account,
                    id: i
                }))];
                return p;
            }, []);
            const monthSet = new Set(this.dataTable.map(d => {
                const date = d.date;
                return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString()}`;
            }));
            const monthArray = [...monthSet].sort((a, b) => {
                const sa = a.split('/').map(o => parseInt(o));
                const sb = b.split('/').map(o => parseInt(o));
                if (sa[1] === sb[1]) return sa[0] - sb[0];
                return sa[1] - sb[1];
            });
            this.months = ['Todos', ...monthArray];
        });
        ipcRenderer.send('stockHistory/get');
    }
};
</script>

<style lang="scss">

    .filter {
        margin: 0 0 0 auto;
    }

    .kpis-card {
        margin: 0 auto;
    }

    .table-container {
        margin: 0 auto;
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
    }

</style>
