<template>
    <q-page class="income-tax q-ma-none q-px-lg">
        <div class="filter">
            <q-select
                v-model="selectedYear"
                outlined
                dense
                options-dense
                label="Ano"
                :options="yearOptions"
                @input="getConsolidatedData"
                class="q-ma-sm"
                style="width: 100px; display: inline-block;"
            />
        </div>

        <q-table
            class="table-container q-mx-lg summary-table"
            table-class="data-table sticky-last-column sticky-first-column"
            title="Sumário mensal"
            :data="monthlySummary"
            :columns="monthlySummaryColumns"
            row-key="row => `${row.code}-${row.id}`"
            flat
            ref="monthlySummaryTable"
            bordered
            :rows-per-page-options="[12]"
            rows-per-page-label="Items por página"
            :hide-pagination="true"
        />

        <q-table
            class="table-container q-mx-lg q-my-lg consolidated-table"
            table-class="data-table"
            title="Consolidado de Ativos"
            :data="consolidatedDataFiltered"
            :columns="consolidatedColumns"
            row-key="code"
            flat
            bordered
            :rows-per-page-options="[10000]"
            hide-pagination
            rows-per-page-label="Items por página"
        >
            <template v-slot:header="props">
                <q-tr :props="props">
                    <q-th auto-width />
                    <q-th
                        v-for="col in props.cols"
                        :key="col.name"
                        :props="props"
                    >
                        {{ col.label }}
                    </q-th>
                </q-tr>
            </template>

            <template v-slot:body="props">
                <q-tr :props="props" class="consolidated-row" :class="{ 'total': props.row.isTotal }">
                    <q-td auto-width>
                        <q-btn size="sm" color="accent" round dense @click="props.expand = !props.expand" :icon="props.expand ? 'remove' : 'add'" />
                    </q-td>

                    <template v-for="col in props.cols">
                        <q-td
                            :key="col.name"
                            :props="props"
                            v-if="col.name === 'profitLoss' || col.name === 'dividends'"
                            :class="{ 'value-up': col.value > 0, 'value-down': col.value < 0 }">
                            {{ NumberUtils.formatNumber(col.value, 'R$') }}
                        </q-td>
                        <q-td v-else :key="col.name" :props="props">
                            {{ col.value }}
                        </q-td>
                    </template>

                </q-tr>
                <q-tr v-show="props.expand" :props="props" class="consolidated-row-details">
                    <q-td colspan="100%">
                        <q-table
                            grid
                            hide-header
                            hide-pagination
                            :columns="consolidatedDetailColumns"
                            :data="props.row.details"
                        />
                    </q-td>
                </q-tr>
            </template>
        </q-table>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-shared/utils/NumberUtils';
import DateUtils from '../../src-shared/utils/DateUtils';

export default {
    name: 'PageIncomeTax',
    data() {
        return {
            NumberUtils: NumberUtils,
            DateUtils: DateUtils,
            historyData: [],
            consolidatedData: [],
            dividends: [],
            selectedYear: null,
            yearOptions: [],
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
            consolidatedColumns: [
                {
                    name: 'code',
                    align: 'center',
                    label: 'Ativo',
                    field: 'code',
                    sortable: true
                },
                {
                    name: 'quantityBalanceEver',
                    align: 'right',
                    label: 'Qt. em Carteira',
                    field: 'quantityBalanceEver',
                    sortable: true
                },
                {
                    name: 'valueBalanceEver',
                    align: 'right',
                    label: 'Valor em carteira',
                    field: 'valueBalanceEver',
                    sortable: true,
                    format: val => val || val === 0 ? NumberUtils.formatNumber(val, 'R$ ') : ''
                },
                {
                    name: 'averageBuyPrice',
                    align: 'right',
                    label: 'Pç. Médio Compra',
                    field: 'averageBuyPrice',
                    sortable: true,
                    format: val => val || val === 0 ? NumberUtils.formatNumber(val, 'R$ ') : ''
                },
                {
                    name: 'averageSellPrice',
                    align: 'right',
                    label: 'Pç. Médio Venda',
                    field: 'averageSellPrice',
                    sortable: true,
                    format: val => val || val === 0 ? NumberUtils.formatNumber(val, 'R$ ') : ''
                },
                {
                    name: 'profitLoss',
                    align: 'right',
                    label: 'Lucro/Prejuízo na venda',
                    field: 'profitLoss',
                    sortable: true
                },
                {
                    name: 'dividends',
                    align: 'right',
                    label: 'Dividendos pagos',
                    field: 'dividends',
                    sortable: true
                }
            ],
            consolidatedDetailColumns: [
                {
                    name: 'institution',
                    align: 'center',
                    label: 'Corretora',
                    field: 'institution',
                    sortable: true
                },
                {
                    name: 'buyOperations',
                    align: 'right',
                    label: 'Operações de Compra',
                    field: 'buyOperations',
                    sortable: true
                },
                {
                    name: 'sellOperations',
                    align: 'right',
                    label: 'Operações de Venda',
                    field: 'sellOperations',
                    sortable: true
                }
            ]
        };
    },
    methods: {
        init() {
            ipcRenderer.send('stockHistory/get');
            ipcRenderer.send('dividends/get');
        },
        getConsolidatedData() {
            const startDate = new Date(`${this.selectedYear}-01-01`);
            const endDate = new Date(`${this.selectedYear + 1}-01-01`);
            ipcRenderer.send('stockHistory/consolidated', { startDate: startDate, endDate: endDate });
        }
    },
    computed: {
        monthlySummaryColumns() {
            return [{
                name: 'operation',
                align: 'center',
                label: 'Operação',
                field: 'operation'
            },
            ...this.months.map(o => ({
                name: o,
                align: 'right',
                label: o,
                field: o,
                format: val => NumberUtils.formatNumber(val, 'R$ ')
            })),
            {
                name: 'total',
                align: 'right',
                label: 'Total',
                field: 'total',
                format: val => NumberUtils.formatNumber(val, 'R$ ')
            }
            ];
        },
        monthlySummary() {
            const baseData = this.months.reduce((p, c) => { p[c] = 0; return p }, {});
            baseData['total'] = 0;

            const buy = this.historyData
                .filter(o => o.date.getFullYear() === this.selectedYear && o.operation === 'C')
                .reduce((p, c) => {
                    const month = this.months[c.date.getMonth()];
                    p[month] += c.price * c.quantity;
                    p['total'] += c.price * c.quantity;
                    return p;
                }, { operation: 'Compra', ...baseData });

            const sell = this.historyData
                .filter(o => o.date.getFullYear() === this.selectedYear && o.operation === 'V')
                .reduce((p, c) => {
                    const month = this.months[c.date.getMonth()];
                    p[month] += c.price * c.quantity;
                    p['total'] += c.price * c.quantity;
                    return p;
                }, { operation: 'Venda', ...baseData });

            return [buy, sell];
        },
        consolidatedDataFiltered() {
            const data = this.consolidatedData
                .filter(o => o.quantityBought > 0 || o.quantitySold > 0 || o.quantityBalanceEver > 0)
                .map(o => {
                    const details = Object.keys(o.operationsByInstitution)
                        .map(i => ({
                            institution: i,
                            buyOperations: o.operationsByInstitution[i].buy,
                            sellOperations: o.operationsByInstitution[i].sell
                        }));
                    return {
                        ...o,
                        valueBalanceEver: o.quantityBalanceEver * o.averageBuyPrice,
                        details: details
                    };
                });

            const total = data.reduce((p, c) => {
                p.valueBalanceEver += c.valueBalanceEver;
                p.dividends += c.dividends;
                p.profitLoss += c.profitLoss;
                c.details.forEach(d => {
                    const detail = p.details.first(o => o.institution === d.institution);
                    if (detail) {
                        detail.buyOperations += d.buyOperations;
                        detail.sellOperations += d.sellOperations;
                    } else {
                        p.details.push({
                            institution: d.institution,
                            buyOperations: d.buyOperations,
                            sellOperations: d.sellOperations
                        });
                    }
                });
                return p;
            }, {
                code: 'Total',
                quantityBalanceEver: '',
                valueBalanceEver: 0,
                averageBuyPrice: '',
                averageSellPrice: '',
                dividends: 0,
                profitLoss: 0,
                isTotal: true,
                details: []
            });

            return [...data, total];
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            this.historyData = arg.map(o => {
                o.date = new Date(o.date);
                return o;
            }).sort((s1, s2) => s2.date - s1.date);

            this.yearOptions = this.historyData
                .map(o => o.date.getFullYear())
                .distinct()
                .sort((a, b) => b - a);

            this.selectedYear = this.yearOptions.first();
            this.getConsolidatedData();
        });

        ipcRenderer.on('stockHistory/consolidated', (event, arg) => {
            this.tableLoading = false;
            if (arg.status === 'success')
                this.consolidatedData = arg.data;
            else {
                this.$q.notify({ type: 'negative', message: `Erro ao computar dados consolidados: ${arg.message}` });
                console.error(arg);
            }
        });

        ipcRenderer.on('dividends/get', (event, response) => {
            if (response.status === 'success') {
                this.dividends = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar dividendos` });
                console.error(response);
            }
        });

        this.init();
    }
};
</script>

<style lang="scss">

    .income-tax {
        .filter {
            text-align: right;
            width: 100%;
        }

        .consolidated-table {
            height: 500px;

            tbody {
                position: relative;
                tr.total {
                    font-weight: bold;
                    background: #eee !important;
                    position: fixed;
                    z-index: 2;
                    bottom: 0;
                }

                .consolidated-row:nth-child(4n + 1) {
                    background: #fff;
                }

                tr.consolidated-row:hover {
                    background-color: #f0f0f0;
                }
            }

        }
    }
</style>
