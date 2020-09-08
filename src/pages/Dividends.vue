<template>
    <q-page class="dividends-page q-px-lg">
        <div class="row q-px-sm q-py-lg justify-between items-center">
            <q-card class="kpis-card q-px-lg q-py-md" flat bordered>
                <q-card-section horizontal>
                    <template v-for="(kpi, i) in kpis">

                        <q-card-section :key="`kpi-${i}`">
                            <div class="label">{{ kpi.label }}</div>
                            <div class="value" :class="{ 'value-up': kpi.value > 0 && kpi.colorFormat, 'value-down': kpi.value < 0 && kpi.colorFormat }">
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
            table-class="data-table sticky-last-column"
            title="Carteira de Dividendos"
            :data="dataTable"
            :columns="columns"
            row-key="row => row.code"
            flat
            bordered
            :rows-per-page-options="[50, 100, 150]"
            rows-per-page-label="Items por página"
            :pagination.sync="pagination"
            v-dynamic-height="{ heightOffset: 350, innerSelector: '.q-table__middle' }"
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
                    :display-value="`Colunas (${visibleColumns.length}/${columns.length - 1})`"
                    @input="changeVisibleColumns"
                    emit-value
                    map-options
                    :options="columns.dropLast()"
                    option-value="name"
                    options-cover
                    style="min-width: 150px"
                    class="q-ma-sm"
                />

                <q-btn-dropdown flat color="primary" label=".CSV">
                    <q-list>
                        <q-item clickable v-close-popup @click="downloadCsv">
                            <q-item-section>
                                <q-item-label>Download</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="downloadCsv">
                            <q-item-section>
                                <q-item-label>Upload</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
                <q-btn flat icon="eva-plus-circle-outline" @click="showCreateForm = true;" color="primary" title="Adicionar dividendo" />
            </template>

            <template v-slot:body="props">
                <q-tr :props="props" :class="{'future-event': props.row.isFuture}">
                    <q-td v-for="col in props.cols" :key="col.name" :class="col.__tdClass">
                        <template v-if="col.name !== 'action'">
                            {{ col.value }}
                        </template>
                        <q-btn v-else round flat class="q-ma-none" icon="eva-trash-2-outline" size="10px" @click="deleteRow(props.row)" color="primary" />
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

        <q-dialog v-model="showCreateForm">
            <q-card>
                <stoincs-form
                    v-model="newDividend"
                    title="Novo dividendo"
                    @cancel="showCreateForm = false;"
                    @submit="saveDividend"
                    :fields="createFormFields" />
            </q-card>
        </q-dialog>

    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-shared/utils/NumberUtils';
import DateUtils from '../../src-shared/utils/DateUtils';
import StoincsForm from '../components/StoincsForm';

export default {
    name: 'PageDividends',
    components: {
        StoincsForm
    },
    data() {
        return {
            now: new Date(),
            dividends: [],
            pagination: {
                rowsPerPage: 50
            },
            visibleColumns: [ 'code', 'type', 'quantity', 'date', 'grossValue', 'netValue', 'source' ],
            columns: [
                {
                    name: 'institution',
                    label: 'Instituição',
                    align: 'left',
                    field: 'institution',
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
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'netValue',
                    align: 'right',
                    label: 'Valor Líquido',
                    field: 'netValue',
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'source',
                    align: 'center',
                    label: 'Origem',
                    field: 'source',
                    sortable: true
                },
                {
                    name: 'action',
                    align: 'center',
                    label: 'Ações',
                    field: 'action',
                    required: true
                }
            ],
            NumberUtils: NumberUtils,
            DateUtils: DateUtils,
            tableLoading: true,
            showCreateForm: false,
            newDividend: {}
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
        },
        saveDividend() {
            this.showCreateForm = false;
            this.newDividend.quantity = NumberUtils.getNumberFromString(this.newDividend.quantity);
            this.newDividend.grossValue = NumberUtils.getNumberFromString(this.newDividend.grossValue);
            this.newDividend.netValue = NumberUtils.getNumberFromString(this.newDividend.netValue);
            if (this.newDividend.date)
                this.newDividend.date = DateUtils.fromDateStr(this.newDividend.date);

            ipcRenderer.send('dividends/save', this.newDividend);
            this.newDividend = {};
        },
        deleteRow(row) {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Tem certeza que deseja remover este item?',
                cancel: {
                    label: 'Não',
                    flat: true
                },
                ok: {
                    label: 'Sim',
                    flat: true
                },
                persistent: true
            }).onOk(() => {
                ipcRenderer.send('dividends/delete', row);
            });
        },
        downloadCsv() {
            ipcRenderer.send('dividends/download-csv');
        }
    },
    computed: {
        dataTable() {
            return this.dividends.map(d => {
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
        },
        createFormFields() {
            return [
                {
                    id: 'institution',
                    label: 'Instituição',
                    type: 'autocomplete',
                    options: this.dataTable.map(o => o.institution).distinct().sort()
                },
                {
                    id: 'account',
                    label: 'Conta',
                    type: 'autocomplete',
                    options: this.dataTable.map(o => o.account).distinct().sort()
                },
                {
                    id: 'code',
                    label: 'Ativo',
                    type: 'text'
                },
                {
                    id: 'type',
                    label: 'Tipo',
                    type: 'autocomplete',
                    options: this.dataTable.map(o => o.type).distinct().sort()
                },
                {
                    id: 'stockType',
                    label: 'Tipo de Ativo',
                    type: 'autocomplete',
                    options: this.dataTable.map(o => o.stockType).distinct().sort()
                },
                {
                    id: 'quantity',
                    label: 'Quantidade',
                    type: 'text',
                    fillMask: '0',
                    mask: '#',
                    reverseFillMask: true
                },
                {
                    id: 'date',
                    label: 'Data de pagamento',
                    type: 'date',
                    required: false
                },
                {
                    id: 'grossValue',
                    label: 'Valor Bruto',
                    type: 'text',
                    fillMask: '0',
                    mask: 'R$ #,##',
                    reverseFillMask: true
                },
                {
                    id: 'netValue',
                    label: 'Valor Líquido',
                    type: 'text',
                    fillMask: '0',
                    mask: 'R$ #,##',
                    reverseFillMask: true
                }
            ];
        }
    },
    mounted() {
        ipcRenderer.on('dividends/get', (event, response) => {
            this.tableLoading = false;
            if (response.status === 'success') {
                this.dividends = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar dividendos` });
                console.error(response);
            }
        });

        ipcRenderer.on('dividends/save', (event, response) => {
            this.tableLoading = false;
            if (response.status === 'success') {
                this.init();
            } else {
                this.$q.notify({ type: 'negative', message: response.message });
                console.error(response);
            }
        });

        ipcRenderer.on('dividends/delete', (event, response) => {
            this.tableLoading = false;
            if (response.status === 'success') {
                this.init();
                this.$q.notify({ type: 'positive', message: 'Operação removida com sucesso' });
            } else {
                this.$q.notify({ type: 'negative', message: 'Erro ao deletar evento' });
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
