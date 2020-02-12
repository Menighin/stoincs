<template>
    <q-page class="">
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
            <q-card class="kpis-card q-px-lg q-py-md" flat bordered>
                <q-card-section horizontal>
                    <template v-for="(kpi, i) in kpis">

                        <q-card-section :key="`kpi-${i}`">
                            <div class="label">{{kpi.label}}</div>
                            <div class="value" :style="{color: kpi.color}">{{kpi.value}}</div>
                        </q-card-section>

                        <q-separator vertical :key="`separator-${i}`" v-if="i !== kpis.length - 1" />

                    </template>
                </q-card-section>
            </q-card>
        </div>

        <q-table
            class="table-container q-mx-lg"
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
                    :display-value="`Colunas (${visibleColumns.length}/${columns.length})`"
                    emit-value
                    map-options
                    :options="columns"
                    option-value="name"
                    options-cover
                    style="min-width: 150px"
                />

                <q-btn flat icon="eva-plus-circle-outline" @click="goToViewLog(cell.row)" color="primary" />
            </template>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat icon="eva-trash-2-outline" @click="deleteRow(props.row)" color="primary" />
            </q-td>
        </q-table>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-electron/utils/NumberUtils';

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
            visibleColumns: [ 'code', 'operation', 'date', 'quantity', 'price', 'totalValue', 'source' ],
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
                    align: 'right',
                    label: 'Quantidade',
                    field: 'quantity',
                    sortable: true
                },
                {
                    name: 'price',
                    align: 'right',
                    label: 'Preço',
                    field: 'price',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'totalValue',
                    align: 'right',
                    label: 'Total',
                    field: 'totalValue',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'source',
                    align: 'center',
                    label: 'Origem',
                    field: 'source'
                },
                {
                    name: 'action',
                    align: 'center',
                    label: 'Ações',
                    field: 'action',
                    required: true
                }
            ]
        };
    },
    methods: {
        deleteRow(row) {
            this.$q.dialog({
                title: 'Confirm',
                message: 'Would you like to turn on the wifi?',
                cancel: true,
                persistent: true
            }).onOk(() => {
                ipcRenderer.send('stockHistory/delete', row.id);
            }).onCancel(() => {
                // console.log('>>>> Cancel')
            }).onDismiss(() => {
                // console.log('I am triggered on both OK and Cancel')
            });
        }
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
        },
        kpis() {
            const bought = this.filteredDataTable
                .filter(o => o.operation === 'C')
                .reduce((p, c) => p + c.totalValue, 0);

            const sold = this.filteredDataTable
                .filter(o => o.operation === 'V')
                .reduce((p, c) => p + c.totalValue, 0);

            const total = sold - bought;

            return [
                {
                    label: 'Compra',
                    value: NumberUtils.formatCurrency(bought),
                    color: '#C10015'
                },
                {
                    label: 'Venda',
                    value: NumberUtils.formatCurrency(sold),
                    color: '#21BA45'
                },
                {
                    label: 'Total',
                    value: NumberUtils.formatCurrency(total),
                    color: total > 0 ? '#21BA45' : '#C10015'
                }
            ];
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            this.data = arg;
            this.dataTable = this.data.reduce((p, c, i) => {
                p = [...p, ...c.stockHistory.map(s => ({
                    ...s,
                    date: new Date(s.date),
                    institution: c.institution,
                    account: c.account
                }))];
                return p;
            }, []).sort((s1, s2) => s1.date - s2.date);

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
        text-align: right;
    }

    .kpis-card {
        margin: 0 auto;
        .label {
            color: $label;
            font-size: 10px;
        }

        .value {
            font-size: 32px;
            font-weight: bold;
        }
    }

    .table-container {

        .q-table__middle {
            max-height: 500px;
        }

        thead tr th {
            position: sticky;
            z-index: 1;
        }

        thead tr:first-child th {
            top: 0;
            background: #FFF;
        }

        .stock-table {
            table {
                tbody {
                    tr:nth-child(odd) {
                        background: #f7f7f7;
                    }
                }
            }

        }
    }

</style>
