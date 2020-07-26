<template>
    <q-page class="dividends-page">
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
            title="Carteira de Dividendos"
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
                <h5 style="margin: 0 5px 0 0">Dividendos</h5>
                <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                    <q-menu anchor="bottom right" self="top right" content-class="q-pa-sm">
                        Contém as informações dos dividendos pagos. As colunas são:<br />
                        <ul>
                            <li><strong>Corretora</strong>: Conta e corretora que o valor será recebido</li>
                            <li><strong>Ativo</strong>: Ativo referente ao pagamento</li>
                            <li><strong>Tipo</strong>: Tipo de pagamento</li>
                            <li><strong>Tipo de Ativo</strong>: Tipo do Ativo em questão</li>
                            <li><strong>Quantidade</strong>: Quantidade do Ativo referente ao pagamento</li>
                            <li><strong>Data de Pagamento</strong>: Data do pagamento</li>
                            <li><strong>Valor Bruto</strong>: Valor bruto a ser pago</li>
                            <li><strong>Valor Líquido</strong>: Valor líquido a ser pago</li>
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
                    @input="changeVisibleColumns"
                    emit-value
                    map-options
                    :options="columns"
                    option-value="name"
                    options-cover
                    style="min-width: 150px"
                    class="q-ma-sm"
                />
            </template>

            <template v-slot:body="props">
                <q-tr :props="props" :class="{'future-event': props.row.isFuture}">
                    <q-td v-for="col in props.cols" :key="col.name" :class="col.__tdClass">
                        {{ col.value }}
                    </q-td>
                </q-tr>
            </template>

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
    name: 'PageDividends',
    data() {
        return {
            now: new Date(),
            dividends: [],
            pagination: {
                rowsPerPage: 50
            },
            visibleColumns: [ 'code', 'type', 'quantity', 'date', 'grossValue', 'netValue' ],
            columns: [
                {
                    name: 'broker',
                    align: 'center',
                    label: 'Corretora',
                    field: 'broker',
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
                    name: 'type',
                    align: 'center',
                    label: 'Tipo',
                    field: 'type',
                    sortable: true
                },
                {
                    name: 'stockType',
                    align: 'center',
                    label: 'Tipo de Ativo',
                    field: 'stockType',
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
                    name: 'date',
                    align: 'center',
                    label: 'Data de Pagamento',
                    field: 'date',
                    format: val => val ? DateUtils.toString(new Date(val), true, false) : 'Indefinido'
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
                    name: 'netValue',
                    align: 'right',
                    label: 'Valor Líquido',
                    field: 'netValue',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                }
            ],
            NumberUtils: NumberUtils,
            DateUtils: DateUtils,
            tableLoading: true
        };
    },
    methods: {
        init() {
            ipcRenderer.send('dividends/get');
            if (localStorage.getItem('dividends/columns'))
                this.visibleColumns = JSON.parse(localStorage.getItem('dividends/columns'));
        },
        changeVisibleColumns() {
            localStorage.setItem('dividends/columns', JSON.stringify(this.visibleColumns));
        }
    },
    computed: {
        dataTable() {
            return this.dividends.map(d => {
                d.broker = `${d.institution} - ${d.account}`;
                return d;
            });
        },
        kpis() {
            const totalGross = this.dataTable.filter(o => !o.isFuture).reduce((p, c) => p + c.grossValue, 0);
            const totalNet = this.dataTable.filter(o => !o.isFuture).reduce((p, c) => p + c.netValue, 0);
            const futureNet = this.dataTable.filter(o => o.isFuture).reduce((p, c) => p + c.netValue, 0);
            return [
                {
                    label: 'Ganhos Brutos',
                    value: totalGross,
                    colorFormat: true
                },
                {
                    label: 'Ganhos Líquidos',
                    value: totalNet,
                    colorFormat: true
                },
                {
                    label: 'Ganhos Futuros Líquidos',
                    value: futureNet,
                    colorFormat: true
                }
            ];
        }
    },
    mounted() {
        ipcRenderer.on('dividends/get', (event, response) => {
            console.log(response);
            this.tableLoading = false;
            if (response.status === 'success') {
                this.dividends = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar dividendos` });
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

    .dividends-page {

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

            .future-event {
                color: #777;
            }
        }
    }

</style>
