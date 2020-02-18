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
            :loading="tableLoading"
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
                    class="q-ma-sm"
                />

                <q-btn flat class="q-ma-sm" icon="eva-plus-circle-outline" @click="showCreateForm = true" color="primary" />
            </template>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat icon="eva-trash-2-outline" @click="deleteRow(props.row)" color="primary" />
            </q-td>
        </q-table>

        <q-dialog v-model="showCreateForm" persistent>
            <q-card>
                <q-card-section class="row items-center">
                    <div class="q-gutter-md q-ma-md" style="width: 400px; max-width: 500px">
                        <q-input class="q-ma-sm" filled v-model="newOperation.institution" label="Instituição" />
                        <q-input class="q-ma-sm" filled v-model="newOperation.account" label="Conta" />
                        <q-input class="q-ma-sm" filled v-model="newOperation.code" label="Ativo" />
                        <q-select :options="['C', 'V']" class="q-ma-sm" filled v-model="newOperation.operation" label="Operação" />
                        <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.date" mask="##/##/####" :rules="['date']" label="Data">
                            <template v-slot:append>
                                <q-icon name="event" class="cursor-pointer">
                                    <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                        <q-date mask="DD/MM/YYYY" v-model="newOperation.date" @input="() => $refs.qDateProxy.hide()" />
                                    </q-popup-proxy>
                                </q-icon>
                            </template>
                        </q-input>
                        <q-input class="q-ma-sm" filled v-model="newOperation.quantity" label="Quantidade" />
                        <q-input class="q-ma-sm" filled v-model="newOperation.price" label="Preço" mask="R$ #,##" reverse-fill-mask />
                        <q-input class="q-ma-sm" filled :value="totalNewOperation" label="Total" disable />
                    </div>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="primary" v-close-popup />
                    <q-btn flat label="Salvar" color="primary" v-close-popup />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-electron/utils/NumberUtils';

export default {
    name: 'PageStocks',
    data() {
        return {
            dataTable: [],
            months: ['Todos', '08/2018', '09/2018'],
            selectedMonth: 'Todos',
            tableLoading: false,
            showCreateForm: false,
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
            ],
            newOperation: {
            }
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
        },
        totalNewOperation() {
            const price = this.newOperation.price ? NumberUtils.getNumberFromCurrency(this.newOperation.price) : 0;
            const result = price * this.newOperation.quantity || 0;
            return NumberUtils.formatCurrency(result);
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            this.dataTable = arg.reduce((p, c, i) => {
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

        ipcRenderer.on('stockHistory/delete', (event, args) => {
            this.tableLoading = false;
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Operação removida com sucesso' });
                this.dataTable = this.dataTable.filter(d => d.id !== args.id);
            } else {
                this.$q.notify({ type: 'negative', message: 'Um erro ocorreu ao remover operação' });
                console.error(args.error);
            }
        });
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
