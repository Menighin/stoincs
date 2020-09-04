<template>
    <q-page class="treasury-direct-wallet-page q-px-lg">
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
                        <q-item clickable v-close-popup @click="downloadCsv">
                            <q-item-section>
                                <q-item-label>Upload</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
                <q-btn flat icon="eva-plus-circle-outline" @click="newOperation = {}; showCreateForm = true;" color="primary" title="Adicionar ativo" />
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

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat icon="eva-trash-2-outline" size="12px" @click="deleteRow(props.row)" color="primary" />
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

        <q-dialog v-model="showCreateForm" persistent>
            <q-card>
                <create-item-form
                    title="Nova operaçã1"
                    @cancel="showCreateForm = false;"
                    @submit="saveOperation"
                    :fields="createFormFields" />
                <!-- <q-form @submit="saveOperation" class="q-gutter-md">
                    <q-card-section class="row items-center">
                        <div class="q-gutter-md q-ma-md" style="width: 400px; max-width: 500px">
                            <div class="text-h5">Nova Operação</div>

                            <q-select
                                filled
                                v-model="newOperation.institution"
                                label="Instituição"
                                use-input
                                clearable
                                new-value-mode="add-unique"
                                :options="filteredInstitutions"
                                @filter="filterInstitutionFn"
                                @input-value="(v) => newOperation.partialInstitution = v"
                                @blur="blurSelect('institution')"
                                lazy-rules
                                class="q-ma-sm" style="padding-bottom: 0"
                                :rules="[ val => val && val.length > 0 || '']"
                            />

                            <q-select
                                filled
                                v-model="newOperation.account"
                                label="Conta"
                                use-input
                                clearable
                                new-value-mode="add-unique"
                                :options="filteredAccounts"
                                @filter="filterAccountFn"
                                @input-value="(v) => newOperation.partialAccount = v"
                                @blur="blurSelect('account')"
                                lazy-rules
                                class="q-ma-sm" style="padding-bottom: 0"
                                :rules="[ val => val && val.length > 0 || '']"
                            />

                            <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.code" label="Ativo" lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                            <q-select :options="['C', 'V']" style="padding-bottom: 0" class="q-ma-sm" filled v-model="newOperation.operation" label="Operação" lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                            <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.date" mask="##/##/####" label="Data"  lazy-rules :rules="[ val => val && val.length > 0 || '']">
                                <template v-slot:append>
                                    <q-icon name="event" class="cursor-pointer">
                                        <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                            <q-date mask="DD/MM/YYYY" v-model="newOperation.date" @input="() => $refs.qDateProxy.hide()" />
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                            <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.quantity" label="Quantidade" lazy-rules :rules="[ val => val && val != null ]" />
                            <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.price" label="Preço" fill-mask="0" mask="R$ #,##" reverse-fill-mask lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                        </div>
                    </q-card-section>

                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" color="primary" v-close-popup />
                        <q-btn flat label="Salvar" type="submit" color="primary" />
                    </q-card-actions>
                </q-form> -->
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-shared/utils/NumberUtils';
import DateUtils from '../../src-shared/utils/DateUtils';
import CreateItemForm from '../components/CreateItemForm';

export default {
    name: 'PageTreasuryDirectWallet',
    components: {
        CreateItemForm
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
            filteredAccounts: []
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
            console.log(form);
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
        filterInstitutionFn(val, update) {
            update(() => {
                if (val === '') {
                    this.filteredInstitutions = this.institutionOptions;
                } else {
                    const needle = val.toLowerCase();
                    this.filteredInstitutions = this.institutionOptions.filter(
                        v => v.toLowerCase().indexOf(needle) > -1
                    );
                }
            });
        },
        filterAccountFn(val, update) {
            update(() => {
                if (val === '') {
                    this.filteredAccounts = this.accountOptions;
                } else {
                    const needle = val.toLowerCase();
                    this.filteredAccounts = this.accountOptions.filter(
                        v => v.toLowerCase().indexOf(needle) > -1
                    );
                }
            });
        },
        blurSelect(field) {
            if (field === 'institution') {
                if (this.newOperation.partialInstitution && this.newOperation.partialInstitution.length > 0)
                    this.newOperation.institution = this.newOperation.partialInstitution;
            } else if (field === 'account') {
                if (this.newOperation.partialAccount && this.newOperation.partialAccount.length > 0)
                    this.newOperation.account = this.newOperation.partialAccount;
            }
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
        institutionOptions() {
            return [...new Set(this.dataTable.map(o => o.institution).sort())];
        },
        accountOptions() {
            return [...new Set(this.dataTable.map(o => o.account).sort())];
        },
        createFormFields() {
            return [
                {
                    id: 'test',
                    label: 'Testando',
                    type: 'text'
                },
                {
                    id: 'institution',
                    label: 'Instituição',
                    type: 'autocomplete',
                    options: ['abcd', 'efgh']
                },
                {
                    id: 'operation',
                    label: 'Tipo',
                    type: 'select',
                    options: [{ value: 'c', label: 'Compra' }, { value: 'v', label: 'Venda' }]
                },
                {
                    id: 'date',
                    label: 'Data',
                    type: 'date'
                },
                {
                    id: 'date2',
                    label: 'Data 2',
                    type: 'date'
                },
                {
                    id: 'price',
                    type: 'text',
                    label: 'Preço',
                    fillMask: '0',
                    mask: 'R$ #,##',
                    reverseFillMask: true
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
