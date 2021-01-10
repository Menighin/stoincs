<template>
    <q-page class="stock-history-consolidated q-ma-none q-px-lg">
        <div class="row q-pa-sm justify-between items-center">
            <q-card class="kpis-card q-px-lg q-py-md" flat bordered>
                <q-card-section horizontal>
                    <template v-for="(kpi, i) in kpis">

                        <q-card-section :key="`kpi-${i}`">
                            <div class="label">{{kpi.label}}</div>
                            <div class="value" :class="{ 'value-up': kpi.value > 0, 'value-down': kpi.value < 0 }">
                                {{ NumberUtils.formatNumber(kpi.value, 'R$ ') }}
                            </div>
                        </q-card-section>

                        <q-separator vertical :key="`separator-${i}`" v-if="i !== kpis.length - 1" />

                    </template>
                </q-card-section>
            </q-card>
        </div>

        <q-table
            class="table-container q-mx-lg"
            table-class="data-table sticky-first-column"
            title="Histórico"
            :data="dataTableFiltered"
            :columns="columns"
            row-key="row => `${row.code}-${row.id}`"
            flat
            bordered
            :rows-per-page-options="[25, 50, 100]"
            rows-per-page-label="Items por página"
            :pagination.sync="pagination"
            :visible-columns="visibleColumns"
            :loading="tableLoading"
            v-dynamic-height="{ heightOffset: 350, innerSelector: '.q-table__middle' }"
        >
            <template v-slot:top>
                <h5 style="margin: 0">Consolidados</h5>

                <q-space />

                <q-input @input="refreshConsolidate" debounce="1000" class="q-ma-sm" style="padding-bottom: 0" outlined dense v-model="startDate" mask="##/##/####" label="Data Inicio">
                    <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" @hide="refreshConsolidate">
                                <q-date mask="DD/MM/YYYY" v-model="startDate" @input="() => $refs.qDateProxy.hide()" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>

                <q-input @input="refreshConsolidate" debounce="1000" class="q-ma-sm" style="padding-bottom: 0" outlined dense v-model="endDate" mask="##/##/####" label="Data Fim">
                    <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale" @hide="refreshConsolidate">
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
                    @input="changeVisibleColumns"
                    :options="columns"
                    option-value="name"
                    options-cover
                    style="min-width: 150px"
                    class="q-ma-sm"
                />
            </template>

            <q-td auto-width slot="body-cell-profitLoss" slot-scope="props" :props="props" :class="{ 'value-up': props.row.historicInfo.profitLoss > 0, 'value-down': props.row.historicInfo.profitLoss < 0 }">
                {{ NumberUtils.formatNumber(props.row.historicInfo.profitLoss, 'R$ ') }}
            </q-td>

            <q-td auto-width slot="body-cell-dividends" slot-scope="props" :props="props" :class="{ 'value-up': props.row.dividends > 0, 'value-down': props.row.dividends < 0 }">
                {{ NumberUtils.formatNumber(props.row.dividends, 'R$ ') }}
            </q-td>

            <template v-slot:no-data="">
                <div class="full-width text-center q-gutter-sm no-data" style="padding: 60px 0" v-if="!tableLoading">
                    <h5> Você ainda não possui dados para esta tabela <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
                    <span>
                        Configure seu acesso ao CEI para integração automática ou insira operações manualmente na tela de extrato para que elas sejam consolidadas aqui.
                    </span>
                </div>
            </template>
        </q-table>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-shared/utils/NumberUtils';
import DateUtils from '../../src-shared/utils/DateUtils';

export default {
    name: 'PageConsolidated',
    data() {
        return {
            tableLoading: true,
            Math: Math,
            NumberUtils: NumberUtils,
            pagination: {
                rowsPerPage: 25
            },
            dataTable: [],
            kpis: {},
            startDate: null,
            endDate: null,
            visibleColumns: [ 'code', 'quantityBought', 'quantitySold', 'quantityBalance', 'valueBought', 'averageBuyPrice', 'valueSold', 'averageSellPrice', 'valueBalance', 'profitLoss', 'dividends' ],
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
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'averageBuyPrice',
                    align: 'right',
                    label: 'Pç. Médio Compra',
                    field: val => val.historicInfo.averageBuyPrice,
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'valueSold',
                    align: 'right',
                    label: 'Valor Vendido',
                    field: 'valueSold',
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'averageSellPrice',
                    align: 'right',
                    label: 'Pç. Médio Venda',
                    field: val => val.historicInfo.averageSellPrice,
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'valueBalance',
                    align: 'right',
                    label: 'Saldo',
                    field: val => val.historicInfo.valueBalance,
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'profitLoss',
                    align: 'right',
                    label: 'Lucro/Prejuízo na venda',
                    field: val => val.historicInfo.profitLoss,
                    sortable: true
                },
                {
                    name: 'dividends',
                    align: 'right',
                    label: 'Dividendos pagos',
                    field: 'dividends',
                    sortable: true
                }
            ]
        };
    },
    methods: {
        refreshConsolidate() {
            const startDate = DateUtils.fromDateStr(this.startDate);
            const endDate = DateUtils.fromDateStr(this.endDate);
            ipcRenderer.send('stockHistory/consolidated', { startDate: startDate, endDate: endDate });
            ipcRenderer.send('stockHistory/kpis', { startDate: startDate, endDate: endDate });

            if (localStorage.getItem('consolidated/columns')) {
                const columnCodes = new Set(this.columns.map(o => o.name));
                this.visibleColumns = JSON.parse(localStorage.getItem('consolidated/columns'))
                    .filter(o => columnCodes.has(o));
            }
        },
        changeVisibleColumns() {
            localStorage.setItem('consolidated/columns', JSON.stringify(this.visibleColumns));
        }
    },
    computed: {
        dataTableFiltered() {
            return this.dataTable.filter(o => o.quantityBought > 0 || o.quantitySold > 0);
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/consolidated', (event, arg) => {
            this.tableLoading = false;
            if (arg.status === 'success') {
                this.dataTable = arg.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao computar dados consolidados: ${arg.message}` });
                console.error(arg);
            }
        });

        ipcRenderer.on('stockHistory/kpis', (event, arg) => {
            if (arg.status === 'success')
                this.kpis = arg.data;
            else {
                this.$q.notify({ type: 'negative', message: `Erro ao computar kpis` });
                console.error(arg);
            }
        });

        this.refreshConsolidate();
    }
};
</script>

<style lang="scss">

    .stock-history-consolidated {
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
                max-height: 620px;
            }
        }
    }
</style>
