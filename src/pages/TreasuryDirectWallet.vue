<template>
    <q-page class="treasury-direct-wallet-page">
        <div class="row q-px-sm q-py-lg justify-between items-center">
            <q-card class="kpis-card q-px-lg q-py-md" flat bordered>
                <q-card-section horizontal>
                    <template v-for="(kpi, i) in kpis">

                        <q-card-section :key="`kpi-${i}`">
                            <div class="label">{{ kpi.label }}</div>
                            <div class="value" :class="{ 'value-up': kpi.value > 0 && kpi.colorFormat, 'value-down': kpi.value < 0 && kpi.colorFormat }">
                                {{ NumberUtils.formatCurrency(kpi.value) }}
                            </div>
                        </q-card-section>

                        <q-separator vertical :key="`separator-${i}`" v-if="i !== kpis.length - 1" />

                    </template>
                </q-card-section>
            </q-card>
        </div>
        <q-table
            class="table-container q-mx-lg"
            table-class="data-table"
            title="Carteira de Tesouro Direto"
            :data="dataTable"
            :columns="columns"
            row-key="row => row.code"
            flat
            bordered
            :rows-per-page-options="[50, 100, 150]"
            rows-per-page-label="Items por página"
            :pagination.sync="pagination"
            :visible-columns="visibleColumns">
            <template v-slot:top>
                <h5 style="margin: 0 5px 0 0">Carteira de Tesouro Direto</h5>
                <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                    <q-menu anchor="bottom right" self="top right" content-class="q-pa-sm">
                        Contém as informações de todos os ativos que você possui saldo. As colunas são:<br />
                        <ul>
                            <li><strong>Titulo</strong>: Código do titulo</li>
                            <li><strong>Quantidade</strong>: Quantidade do titulo na carteira</li>
                            <li><strong>Valor Investido</strong>: Valor em R$ investido nas compras do titulo</li>
                            <li><strong>Valor Bruto</strong>: Valor atual do titulo sem descontar impostos</li>
                            <li><strong>Lucro Bruto</strong>: Lucro atual do titulo sem descontar impostos</li>
                            <li><strong>Valor Líquido</strong>: Lucro atual do titulo descontando impostos</li>
                            <li><strong>Lucro Líquido</strong>: Lucro atual do titulo descontando impostos</li>
                            <li><strong>Data de Vencimento</strong>: Data em que o Título vence e é resgatado automaticamente</li>
                            <li><strong>Atualizado a</strong>: Tempo desde a ultima atualização das informações do título</li>
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
                    :display-value="`Colunas (${visibleColumns.length}/${columns.length})`"
                    emit-value
                    @input="changeVisibleColumns"
                    map-options
                    :options="columns"
                    option-value="name"
                    options-cover
                    style="min-width: 150px"
                    class="q-ma-sm"
                />
            </template>

            <q-td auto-width slot="body-cell-grossProfit" slot-scope="props" :props="props">
                <div class="q-pl-sm profit-cell" :class="{ 'value-up': props.row.grossProfit > 0, 'value-down': props.row.grossProfit < 0 }">
                    {{ NumberUtils.formatCurrency(props.row.grossProfit) }}
                    <div class="variation">{{ NumberUtils.formatPercentage(props.row.grossProfitPercentage) }}</div>
                </div>
            </q-td>

            <q-td auto-width slot="body-cell-netProfit" slot-scope="props" :props="props">
                <div class="q-pl-sm profit-cell" :class="{ 'value-up': props.row.netProfit > 0, 'value-down': props.row.netProfit < 0 }">
                    {{ NumberUtils.formatCurrency(props.row.netProfit) }}
                    <div class="variation">{{ NumberUtils.formatPercentage(props.row.netProfitPercentage) }}</div>
                </div>
            </q-td>

            <template v-slot:no-data="">
                <div class="full-width text-center q-gutter-sm no-data" style="padding: 60px 0" v-if="!tableLoading">
                    <h5> Você ainda não possui dados para esta tabela <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
                    <span>
                        Configure seu acesso ao CEI para integração automática.
                    </span>
                </div>
            </template>
        </q-table>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-electron/utils/NumberUtils';
import DateUtils from '../../src-electron/utils/DateUtils';

export default {
    name: 'PageTreasuryDirectWallet',
    data() {
        return {
            now: new Date(),
            treasuryDirect: [],
            pagination: {
                rowsPerPage: 50
            },
            visibleColumns: [ 'code', 'quantity', 'investedValue', 'grossValue', 'grossProfit', 'netValue', 'netProfit', 'expirationDate', 'lastUpdated' ],
            columns: [
                {
                    name: 'code',
                    align: 'center',
                    label: 'Titulo',
                    field: 'code',
                    sortable: true
                },
                {
                    name: 'quantity',
                    align: 'right',
                    label: 'Quantidade',
                    field: 'quantity',
                    sortable: true
                },
                {
                    name: 'investedValue',
                    align: 'right',
                    label: 'Valor Investido',
                    field: 'investedValue',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'grossValue',
                    align: 'right',
                    label: 'Valor Bruto',
                    field: 'grossValue',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'grossProfit',
                    align: 'right',
                    label: 'Lucro Bruto',
                    field: 'grossProfit',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'netValue',
                    align: 'right',
                    label: 'Valor Líquido',
                    field: 'netValue',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'netProfit',
                    align: 'right',
                    label: 'Lucro Líquido',
                    field: 'netProfit',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'expirationDate',
                    align: 'center',
                    label: 'Data de Vencimento',
                    field: 'expirationDate',
                    format: val => val ? DateUtils.toString(new Date(val), true, false) : null
                },
                {
                    name: 'lastUpdated',
                    align: 'center',
                    label: 'Atualizado a',
                    field: 'lastUpdated',
                    format: val => val ? DateUtils.toString(new Date(val)) : null
                }
            ],
            NumberUtils: NumberUtils,
            DateUtils: DateUtils,
            tableLoading: true
        };
    },
    methods: {
        init() {
            ipcRenderer.send('treasury-direct/get');
            if (localStorage.getItem('treasury-direct/columns'))
                this.visibleColumns = JSON.parse(localStorage.getItem('treasury-direct/columns'));
        },
        changeVisibleColumns() {
            localStorage.setItem('treasury-direct/columns', JSON.stringify(this.visibleColumns));
        }
    },
    computed: {
        dataTable() {
            return this.treasuryDirect.map(t => {
                t.grossProfit = t.grossValue - t.investedValue;
                t.grossProfitPercentage = t.grossProfit / t.investedValue * 100;
                t.netProfit = t.netValue - t.investedValue;
                t.netProfitPercentage = t.netProfit / t.investedValue * 100;
                return t;
            });
        },
        kpis() {
            const totalInvested = this.dataTable.reduce((p, c) => p + c.investedValue, 0);
            const totalGrossProfit = this.dataTable.reduce((p, c) => p + c.grossProfit, 0);
            const totalNetProfit = this.dataTable.reduce((p, c) => p + c.netProfit, 0);
            return [
                {
                    label: 'Total Investido',
                    value: totalInvested,
                    colorFormat: false
                },
                {
                    label: 'Lucro Bruto',
                    value: totalGrossProfit,
                    colorFormat: true
                },
                {
                    label: 'Lucro Líquido',
                    value: totalNetProfit,
                    colorFormat: true
                }
            ];
        }
    },
    mounted() {
        ipcRenderer.on('treasury-direct/get', (event, response) => {
            this.tableLoading = false;
            if (response.status === 'success') {
                this.treasuryDirect = response.data;
                this.treasuryDirect.forEach(t => {
                    t.expirationDate = new Date(t.expirationDate);
                    t.lastUpdated = new Date(t.lastUpdated);
                });
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar tesouro direto` });
                console.error(response);
            }
        });

        this.init();
    },
    beforeDestroy() {
    }
};
</script>

<style lang="scss">

    .treasury-direct-wallet-page {

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
                max-height: 600px;
            }
        }
    }

</style>
