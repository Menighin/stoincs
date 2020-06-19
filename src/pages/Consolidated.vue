<template>
    <q-page class="">
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
            :data="dataTable"
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
                <h5 style="margin: 0">Consolidados</h5>

                <q-space />

                <q-input class="q-ma-sm" style="padding-bottom: 0" outlined dense v-model="startDate" mask="##/##/####" label="Data Inicio"  lazy-rules :rules="[ val => val && val.length > 0 || '']">
                    <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                <q-date mask="DD/MM/YYYY" v-model="startDate" @input="() => $refs.qDateProxy.hide()" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>

                <q-input class="q-ma-sm" style="padding-bottom: 0" outlined dense v-model="endDate" mask="##/##/####" label="Data Fim"  lazy-rules :rules="[ val => val && val.length > 0 || '']">
                    <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                <q-date mask="DD/MM/YYYY" v-model="endDate" @input="() => $refs.qDateProxy.hide()" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>

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
            </template>
        </q-table>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-electron/utils/NumberUtils';
import DateUtils from '../../src-electron/utils/DateUtils';

export default {
    name: 'PageConsolidated',
    data() {
        return {
            rawData: [],
            tableLoading: false,
            Math: Math,
            NumberUtils: NumberUtils,
            pagination: {
                rowsPerPage: 25
            },
            startDate: null,
            endDate: null,
            visibleColumns: [ 'code', 'quantityBought', 'quantitySold', 'quantityBalance', 'valueBought', 'averageBuyPrice', 'valueSold', 'averageSellPrice', 'valueBalance', 'profitLoss' ],
            columns: [
                {
                    name: 'code',
                    align: 'center',
                    label: 'Ativo',
                    field: 'code',
                    sortable: true
                },
                {
                    name: 'quantityBought',
                    align: 'right',
                    label: 'Qt. Comprada',
                    field: 'quantityBought',
                    sortable: true
                },
                {
                    name: 'quantitySold',
                    align: 'right',
                    label: 'Qt. Vendida',
                    field: 'quantitySold',
                    sortable: true
                },
                {
                    name: 'quantityBalance',
                    align: 'right',
                    label: 'Saldo',
                    field: 'quantityBalance',
                    sortable: true
                },
                {
                    name: 'valueBought',
                    align: 'right',
                    label: 'Valor Comprado',
                    field: 'valueBought',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'averageBuyPrice',
                    align: 'right',
                    label: 'Pç. Médio Compra',
                    field: 'averageBuyPrice',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'valueSold',
                    align: 'right',
                    label: 'Valor Vendido',
                    field: 'valueSold',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'averageSellPrice',
                    align: 'right',
                    label: 'Pç. Médio Venda',
                    field: 'averageSellPrice',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'valueBalance',
                    align: 'right',
                    label: 'Saldo',
                    field: 'valueBalance',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'profitLoss',
                    align: 'right',
                    label: 'Lucro/Prejuízo na venda',
                    field: 'profitLoss',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                }
            ]
        };
    },
    computed: {
        filteredRawData() {
            if (this.startDate === null || this.endDate === null) return [];

            const startDate = DateUtils.fromDateStr(this.startDate);
            const endDate = DateUtils.fromDateStr(this.endDate);
            return this.rawData.filter(o => startDate <= o.date && o.date <= endDate);
        },
        averagePrices() {
            if (this.endDate === null) return {};

            const endDate = DateUtils.fromDateStr(this.endDate);

            const totalsByStock = this.rawData
                .filter(o => o.date <= endDate)
                .reduce((p, c, i) => {
                    let key = c.code;
                    if (key.match(/\dF$/) != null)
                        key = key.slice(0, -1);
                    if (!p[key])
                        p[key] = {
                            quantityBought: 0,
                            valueBought: 0,
                            quantitySold: 0,
                            valueSold: 0
                        };

                    if (c.operation === 'C') {
                        p[key].quantityBought += c.quantity;
                        p[key].valueBought += c.totalValue;
                    } else if (c.operation === 'V') {
                        p[key].quantitySold += c.quantity;
                        p[key].valueSold += c.totalValue;
                    }
                    return p;
                }, {});

            return Object.keys(totalsByStock).reduce((p, c, i) => {
                const totals = totalsByStock[c];
                p[c] = {};
                p[c].averageBuyPrice = totals.quantityBought > 0 ? totals.valueBought / totals.quantityBought : 0;
                p[c].averageSellPrice = totals.quantitySold > 0 ? totals.valueSold / totals.quantitySold : 0;
                return p;
            }, {});
        },
        dataTable() {
            const consolidatedByStock = this.filteredRawData.reduce((p, c) => {
                let key = c.code;
                if (key.match(/\dF$/) != null)
                    key = key.slice(0, -1);

                if (!(key in p)) {
                    p[key] = {
                        code: key,
                        quantityBought: 0,
                        quantitySold: 0,
                        valueBought: 0,
                        valueSold: 0
                    };
                }

                if (c.operation === 'C') {
                    p[key].quantityBought += c.quantity;
                    p[key].valueBought += c.totalValue;
                } else if (c.operation === 'V') {
                    p[key].quantitySold += c.quantity;
                    p[key].valueSold += c.totalValue;
                }
                p[key].quantityBalance = p[key].quantityBought - p[key].quantitySold;
                p[key].valueBalance = p[key].valueSold - p[key].valueBought;
                p[key].averageBuyPrice = this.averagePrices[key].averageBuyPrice;
                p[key].averageSellPrice = this.averagePrices[key].averageSellPrice;
                p[key].profitLoss = p[key].quantitySold * p[key].averageSellPrice - p[key].quantitySold * p[key].averageBuyPrice;
                return p;
            }, {});

            return Object.values(consolidatedByStock).sort((a, b) => (a.code > b.code) ? 1 : ((b.code > a.code) ? -1 : 0));
        },
        kpis() {
            const bought = this.filteredRawData
                .filter(o => o.operation === 'C')
                .reduce((p, c) => p + c.totalValue, 0);

            const sold = this.filteredRawData
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
            this.rawData = arg.reduce((p, c, i) => {
                p = [...p, ...c.stockHistory.map(s => ({
                    ...s,
                    date: new Date(s.date)
                }))];
                return p;
            }, []);

            this.startDate = DateUtils.toString(this.rawData.reduce((p, c) => c.date < p ? c.date : p, new Date()), true, false);
            this.endDate = DateUtils.toString(new Date(), true, false);
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
