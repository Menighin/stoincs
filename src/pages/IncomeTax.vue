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
            :hide-pagination="true">

            <template v-slot:body-cell="props">
                <q-td :props="props" v-if="props.row[props.col.field] < 19999.99 || props.col.field === 'operation' || props.col.field === 'total' || props.rowIndex === 0">
                    {{ props.value }}
                </q-td>
                <q-td :props="props" v-else>
                    <q-badge color="negative" :label="props.value" />
                </q-td>
            </template>

        </q-table>

        <q-table
            class="table-container q-mx-lg q-my-lg consolidated-table"
            table-class="data-table"
            title="Consolidado de Ativos"
            :data="consolidatedDataFiltered"
            :columns="consolidatedColumns"
            :visible-columns="visibleColumns"
            row-key="code"
            flat
            bordered
            :rows-per-page-options="[10000]"
            hide-pagination
            rows-per-page-label="Items por página"
        >
            <template v-slot:top>
                <h5 style="margin: 0 5px 0 0">Consolidado de Ativos</h5>
                <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                    <q-menu anchor="bottom right" self="top right" content-class="q-pa-sm">
                        As informações dessa tabela são calculadas de acordo com o seu <strong>Extrato de Operações</strong> e de <strong>Dividendos</strong>.<br />
                        As colunas discriminam informações que devem ser lançadas na declaração anual de imposto de renda de pessoa física.<br />
                        O <strong>Stoincs</strong> deve ser usado apenas como um auxiliar na sua declaração. Confira as informações cuidadosamente.
                        <ul>
                            <li><strong>Saldo em 31/12/ANO</strong>: Lançado em "Bens e Direitos"</li>
                            <li><strong>Lucro/Prejuízo na venda</strong>: Para investidores que negociaram menos de 20 mil mensais, deve ser lançado em "Rendimentos Isentos e Não Tributavéis"</li>
                            <li><strong>Dividendos</strong>: Valor composto por Dividendos e demais Rendimentos. Deve ser lançado em "Rendimentos Isentos e Não Tributavéis"</li>
                            <li><strong>Juros sobre capital próprio</strong>: Deve ser lançado em "Rendimentos sujeitos à tributação excluisiva/definitiva"</li>
                        </ul>
                    </q-menu>
                </q-icon>

                <q-space />

                <q-select
                    v-model="visibleColumns"
                    multiple
                    outlined
                    dense
                    options-dense
                    :display-value="`Colunas (${visibleColumns.length}/${consolidatedColumns.length})`"
                    emit-value
                    map-options
                    :options="consolidatedColumns.map(o => ({ label: o.label, value: o.field }))"
                    @input="changeVisibleColumns"
                    options-cover
                    style="min-width: 150px"
                    class="q-ma-sm"
                />
            </template>

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
                <q-tr :props="props" class="consolidated-row" :class="{ 'total': props.row.isTotal }" @click="props.expand = !props.expand">
                    <q-td auto-width>
                        <q-btn size="sm" color="primary" round flat dense @click.stop="props.expand = !props.expand" :icon="props.expand ? 'remove' : 'add'" />
                    </q-td>

                    <template v-for="col in props.cols">
                        <q-td
                            :key="col.name"
                            :props="props"
                            v-if="col.name === 'profitLoss' || col.name === 'dividends' || col.name === 'jcp'"
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
            lastYearConsolidatedData: [],
            dividends: [],
            selectedYear: null,
            yearOptions: [],
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
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
            ],
            visibleColumns: [ 'code', 'quantityBalanceEver', 'lastYearPosition', 'valueBalanceEver', 'averageBuyPrice', 'averageSellPrice', 'profitLoss', 'dividends', 'jcp' ]
        };
    },
    methods: {
        init() {
            ipcRenderer.send('stockHistory/get');
            ipcRenderer.send('dividends/get');
        },
        getConsolidatedData() {
            const previousYearDate = new Date(`${this.selectedYear - 1}-01-01`);
            const currentYearDate = new Date(`${this.selectedYear}-01-01`);
            const endDate = new Date(`${this.selectedYear + 1}-01-01`);
            ipcRenderer.send('stockHistory/consolidated', { startDate: currentYearDate, endDate: endDate, year: this.selectedYear });
            ipcRenderer.send('stockHistory/consolidated', { startDate: previousYearDate, endDate: currentYearDate, year: this.selectedYear - 1 });
        },
        changeVisibleColumns() {
            localStorage.setItem('income-tax/columns', JSON.stringify(this.visibleColumns));
        }
    },
    computed: {
        consolidatedColumns() {
            return [
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
                    name: 'lastYearPosition',
                    align: 'right',
                    label: `Saldo em 31/12/${this.selectedYear - 1}`,
                    field: 'lastYearPosition',
                    sortable: true,
                    format: val => val || val === 0 ? NumberUtils.formatNumber(val, 'R$ ') : ''
                },
                {
                    name: 'valueBalanceEver',
                    align: 'right',
                    label: `Saldo em 31/12/${this.selectedYear}`,
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
                    label: 'Dividendos',
                    field: 'dividends',
                    sortable: true
                },
                {
                    name: 'jcp',
                    align: 'right',
                    label: 'Juros sobre capital próprio',
                    field: 'jcp',
                    sortable: true
                }
            ];
        },
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
            const lastYearPosition = this.lastYearConsolidatedData
                .reduce((p, c) => {
                    p[c.code] = c.quantityBalanceEver * c.historicInfo.averageBuyPrice;
                    return p;
                }, {});

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
                        averageBuyPrice: o.historicInfo.averageBuyPrice,
                        averageSellPrice: o.historicInfo.averageSellPrice,
                        profitLoss: o.historicInfo.profitLoss,
                        lastYearPosition: lastYearPosition[o.code] || 0,
                        valueBalanceEver: o.quantityBalanceEver * o.historicInfo.averageBuyPrice,
                        details: details
                    };
                });

            const total = data.reduce((p, c) => {
                p.valueBalanceEver += c.valueBalanceEver;
                p.dividends += c.dividends;
                p.jcp += c.jcp;
                p.profitLoss += c.profitLoss;
                p.averageBuyPrice = c.historicInfo.averageBuyPrice;
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
                jcp: 0,
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

            this.selectedYear = this.yearOptions[1] || this.yearOptions.first();
            this.getConsolidatedData();
        });

        ipcRenderer.on('stockHistory/consolidated', (event, arg) => {
            this.tableLoading = false;
            if (arg.status === 'success')
                if (arg.year === this.selectedYear)
                    this.consolidatedData = arg.data;
                else
                    this.lastYearConsolidatedData = arg.data;
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

        if (localStorage.getItem('income-tax/columns')) {
            const columnCodes = new Set(this.consolidatedColumns.map(o => o.name));
            this.visibleColumns = JSON.parse(localStorage.getItem('income-tax/columns'))
                .filter(o => columnCodes.has(o));
        }

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
                tr.total {
                    font-weight: bold;
                    background: #eee !important;
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
