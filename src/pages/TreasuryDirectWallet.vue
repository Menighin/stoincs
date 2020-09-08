<template>
    <q-page class="treasury-direct-wallet-page q-px-lg">
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
            title="Carteira de Tesouro Direto"
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
                    :display-value="`Colunas (${visibleColumns.length}/${columns.length - 1})`"
                    emit-value
                    @input="changeVisibleColumns"
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
                        <q-item clickable v-close-popup @click="uploadCsv">
                            <q-item-section>
                                <q-item-label>Upload</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
                <q-btn flat icon="eva-plus-circle-outline" @click="isEdit = false; showCreateForm = true;" color="primary" title="Adicionar ativo" />
            </template>

            <q-td auto-width slot="body-cell-grossProfit" slot-scope="props" :props="props">
                <div class="q-pl-sm profit-cell" :class="{ 'value-up': props.row.grossProfit > 0, 'value-down': props.row.grossProfit < 0 }">
                    {{ NumberUtils.formatNumber(props.row.grossProfit, 'R$ ') }}
                    <div class="variation">{{ NumberUtils.formatNumber(props.row.grossProfitPercentage, '', '%', true) }}</div>
                </div>
            </q-td>

            <q-td auto-width slot="body-cell-netProfit" slot-scope="props" :props="props">
                <div class="q-pl-sm profit-cell" :class="{ 'value-up': props.row.netProfit > 0, 'value-down': props.row.netProfit < 0 }">
                    {{ NumberUtils.formatNumber(props.row.netProfit, 'R$ ') }}
                    <div class="variation">{{ NumberUtils.formatNumber(props.row.netProfitPercentage, '', '%', true) }}</div>
                </div>
            </q-td>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat round class="q-ma-none" icon="eva-edit-2-outline" size="10px" @click="editRow(props.row)" color="primary" />
                <q-btn round flat class="q-ma-none" icon="eva-trash-2-outline" size="10px" @click="deleteRow(props.row)" color="primary" />
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

        <q-dialog v-model="showCreateForm">
            <q-card>
                <stoincs-form
                    v-model="newOperation"
                    title="Nova operação"
                    @cancel="showCreateForm = false;"
                    @submit="saveOperation"
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
    name: 'PageTreasuryDirectWallet',
    components: {
        StoincsForm
    },
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
                    label: 'Titulo',
                    field: 'code',
                    sortable: true
                },
                {
                    name: 'quantity',
                    align: 'right',
                    label: 'Quantidade',
                    field: 'quantity',
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val)
                },
                {
                    name: 'investedValue',
                    align: 'right',
                    label: 'Valor Investido',
                    field: 'investedValue',
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
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
                    name: 'grossProfit',
                    align: 'right',
                    label: 'Lucro Bruto',
                    field: 'grossProfit',
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
                    name: 'netProfit',
                    align: 'right',
                    label: 'Lucro Líquido',
                    field: 'netProfit',
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
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
            NumberUtils: NumberUtils,
            DateUtils: DateUtils,
            tableLoading: true,
            showCreateForm: false,
            newOperation: {},
            filteredInstitutions: [],
            filteredAccounts: [],
            isEdit: false
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
        },
        saveOperation(form) {
            this.showCreateForm = false;
            this.newOperation.quantity = NumberUtils.getNumberFromString(this.newOperation.quantity);
            this.newOperation.investedValue = NumberUtils.getNumberFromString(this.newOperation.investedValue);
            this.newOperation.grossValue = NumberUtils.getNumberFromString(this.newOperation.grossValue);
            this.newOperation.netValue = NumberUtils.getNumberFromString(this.newOperation.netValue);
            this.newOperation.expirationDate = DateUtils.fromDateStr(this.newOperation.expirationDate);

            if (!this.isEdit)
                ipcRenderer.send('treasury-direct/save', this.newOperation);
            else
                ipcRenderer.send('treasury-direct/update', this.newOperation);
            this.newOperation = {};
        },
        editRow(row) {
            this.isEdit = true;

            this.$set(this.newOperation, 'institution', row.institution);
            this.$set(this.newOperation, 'account', row.account);
            this.$set(this.newOperation, 'code', row.code);
            this.$set(this.newOperation, 'expirationDate', DateUtils.toString(row.expirationDate, true, false));
            this.$set(this.newOperation, 'quantity', NumberUtils.formatNumber(row.quantity));
            this.$set(this.newOperation, 'investedValue', NumberUtils.formatNumber(row.investedValue, 'R$ '));
            this.$set(this.newOperation, 'grossValue', NumberUtils.formatNumber(row.grossValue, 'R$ '));
            this.$set(this.newOperation, 'netValue', NumberUtils.formatNumber(row.netValue, 'R$ '));

            this.showCreateForm = true;
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
                ipcRenderer.send('treasury-direct/delete', row);
            });
        },
        downloadCsv() {
            ipcRenderer.send('treasury-direct/download-csv');
        },
        uploadCsv() {
            ipcRenderer.send('treasury-direct/upload-csv');
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
        },
        createFormFields() {
            return [
                {
                    id: 'institution',
                    label: 'Instituição',
                    type: 'autocomplete',
                    options: this.dataTable.map(o => o.institution).distinct().sort(),
                    disable: this.isEdit
                },
                {
                    id: 'account',
                    label: 'Conta',
                    type: 'autocomplete',
                    options: this.dataTable.map(o => o.account).distinct().sort(),
                    disable: this.isEdit
                },
                {
                    id: 'code',
                    label: 'Título',
                    type: 'text',
                    disable: this.isEdit
                },
                {
                    id: 'quantity',
                    label: 'Quantidade',
                    type: 'text',
                    fillMask: '0',
                    mask: '#,##',
                    reverseFillMask: true
                },
                {
                    id: 'investedValue',
                    label: 'Valor Investido',
                    type: 'text',
                    fillMask: '0',
                    mask: 'R$ #,##',
                    reverseFillMask: true
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
                },
                {
                    id: 'expirationDate',
                    label: 'Data de Vencimento',
                    type: 'date'
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

        ipcRenderer.on('treasury-direct/delete', (event, args) => {
            this.tableLoading = false;
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Tesouro removido com sucesso' });
                this.init();
            } else {
                this.$q.notify({ type: 'negative', message: 'Um erro ocorreu ao remover operação' });
                console.error(args.error);
            }
        });

        ipcRenderer.on('treasury-direct/save', (event, args) => {
            this.tableLoading = false;
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Tesouro criado com sucesso' });
                this.init();
            } else {
                this.$q.notify({ type: 'negative', message: args.message });
                console.error(args.error);
            }
        });

        ipcRenderer.on('treasury-direct/update', (event, args) => {
            this.tableLoading = false;
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Tesouro atualizado com sucesso' });
                this.init();
            } else {
                this.$q.notify({ type: 'negative', message: args.message });
                console.error(args.error);
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
