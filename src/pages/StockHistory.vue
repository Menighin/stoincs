<template>
    <q-page class="stock-page q-px-lg q-py-lg">
        <q-table
            class="table-container q-mx-lg"
            table-class="data-table sticky-last-column"
            title="Histórico"
            :data="filteredDataTable"
            :columns="columns"
            row-key="row => `${row.code}-${row.id}`"
            flat
            ref="dataTable"
            bordered
            :rows-per-page-options="[25, 50, 100]"
            rows-per-page-label="Items por página"
            :pagination.sync="pagination"
            :visible-columns="visibleColumns"
            :loading="tableLoading"
            v-dynamic-height="{ heightOffset: 250, innerSelector: '.q-table__middle' }"
        >
            <template v-slot:top>
                <h5 style="margin: 0">Extrato</h5>

                <q-space />

                <q-input
                    v-model="filterStock"
                    dense
                    outlined
                    label="Ativo"
                    class="q-ma-sm"
                    style="width: 100px"
                />

                <q-select
                    v-model="selectedMonth"
                    outlined
                    dense
                    options-dense
                    label="Meses"
                    :options="months"
                    class="q-ma-sm"
                    style="width: 100px"
                />

                <q-select
                    v-model="visibleColumns"
                    multiple
                    outlined
                    dense
                    options-dense
                    :display-value="`Colunas (${visibleColumns.length}/${columns.length - 1})`"
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
                        <q-item clickable v-close-popup @click="uploadCsv">
                            <q-item-section>
                                <q-item-label>Upload</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
                <q-btn-dropdown flat icon="eva-sync-outline" color="primary" label="CEI">
                    <q-list>
                        <q-item clickable v-close-popup @click="refreshHistory">
                            <q-item-section>
                                <q-item-label>Reimportar</q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="syncCei">
                            <q-item-section>
                                <q-item-label>Sincronizar</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
                <q-btn flat icon="eva-percent-outline" @click="split = {}; showSplitDialog = true" color="primary" title="Split de ativos" />
                <q-btn flat icon="eva-plus-circle-outline" @click="showCreateDialog" color="primary" title="Adicionar ativo" />
            </template>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat round class="q-ma-none" icon="eva-edit-2-outline" size="10px" @click="editRow(props.row)" color="primary" />
                <q-btn flat round class="q-ma-none" icon="eva-trash-2-outline" size="10px" @click="deleteRow(props.row)" color="primary" />
            </q-td>

            <template v-slot:no-data="">
                <div class="full-width text-center q-gutter-sm no-data" style="padding: 60px 0" v-if="!tableLoading">
                    <h5> Você ainda não possui dados para esta tabela <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
                    <span>
                        Configure seu acesso ao CEI para integração automática ou insira operações manualmente para que apareçam aqui.
                    </span>
                </div>
            </template>
        </q-table>

        <q-dialog v-model="showCreateForm">
            <q-card>
                <stoincs-form
                    v-model="newOperation"
                    :title="isEdit ? 'Editar Operação' : 'Nova Operação'"
                    @cancel="showCreateForm = false;"
                    @submit="saveOperation"
                    :fields="createFormFields">

                    <q-input class="q-ma-sm" style="padding-bottom: 0" filled :value="totalNewOperation" label="Total" disable />
                </stoincs-form>
            </q-card>
        </q-dialog>

        <q-dialog v-model="showSplitDialog">
            <q-card>
                <stoincs-form
                    v-model="split"
                    title="Split de Ações"
                    @cancel="showSplitDialog = false;"
                    @submit="splitStocks"
                    :fields="splitFormFields">

                    <q-separator />

                    <q-card-section v-show="split.from && split.to">
                        Resultado: Uma operação de <strong>100</strong> papéis custando <strong>R$ 15,00</strong> cada, passará a ser uma operação de
                        <strong>{{ Math.floor(100 / (split.from / split.to)) }}</strong> papéis custando <strong>{{  NumberUtils.formatNumber((15.00 * (split.from / split.to)), 'R$ ') }}</strong> cada.
                    </q-card-section>
                </stoincs-form>
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
    name: 'PageStockHistory',
    components: {
        StoincsForm
    },
    data() {
        return {
            dataTable: [],
            months: ['Todos', '08/2018', '09/2018'],
            selectedMonth: 'Todos',
            filterStock: '',
            tableLoading: true,
            showCreateForm: false,
            showSplitDialog: false,
            isEdit: false,
            Math: Math,
            NumberUtils: NumberUtils,
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
                    format: val => DateUtils.toString(val, true, false)
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
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'totalValue',
                    align: 'right',
                    label: 'Total',
                    field: 'totalValue',
                    sortable: true,
                    format: (val, row) => NumberUtils.formatNumber(row.quantity * row.price, 'R$ ')
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
            newOperation: {},
            split: {}
        };
    },
    methods: {
        init() {
            ipcRenderer.send('stockHistory/get');
        },
        showCreateDialog() {
            this.newOperation = {};
            this.isEdit = false;
            this.showCreateForm = true;
        },
        deleteRow(row) {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Tem certeza que deseja remover esta operação?',
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
                ipcRenderer.send('stockHistory/delete', row.id);
            });
        },
        editRow(row) {
            this.isEdit = true;

            this.$set(this.newOperation, 'id', row.id);
            this.$set(this.newOperation, 'institution', row.institution);
            this.$set(this.newOperation, 'account', row.account);
            this.$set(this.newOperation, 'code', row.code);
            this.$set(this.newOperation, 'operation', { value: row.operation, label: row.operation === 'C' ? 'Compra' : 'Venda' });
            this.$set(this.newOperation, 'date', DateUtils.toString(row.date, true, false));
            this.$set(this.newOperation, 'quantity', row.quantity);
            this.$set(this.newOperation, 'price', `R$ ${row.price.toFixed(2).replace('.', ',')}`);

            this.showCreateForm = true;
        },
        saveOperation() {
            const payload = {
                ...this.newOperation,
                operation: this.newOperation.operation.value,
                date: this.isEdit ? new Date(this.newOperation.date) : DateUtils.fromDateStr(this.newOperation.date),
                price: NumberUtils.getNumberFromString(this.newOperation.price),
                quantity: parseInt(this.newOperation.quantity)
            };

            if (!this.isEdit)
                ipcRenderer.send('stockHistory/create', payload);
            else
                ipcRenderer.send('stockHistory/update', payload);

            this.showCreateForm = false;
        },
        splitStocks() {
            const payload = {
                ...this.split,
                date: DateUtils.fromDateStr(this.split.date)
            };
            ipcRenderer.send('stockHistory/split', payload);
            this.showSplitDialog = false;
        },
        refreshHistory() {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Essa ação irá remover todo o histórico do CEI e importá-lo novamente do site. Tem certeza que deseja continuar?',
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
                ipcRenderer.send('stockHistory/refresh');
            });
        },
        downloadCsv() {
            ipcRenderer.send('stockHistory/download-csv');
        },
        uploadCsv() {
            ipcRenderer.send('stockHistory/upload-csv');
        },
        syncCei() {
            ipcRenderer.send('stockHistory/sync-cei');
        }
    },
    computed: {
        filteredDataTable() {
            let filteredData = this.dataTable;
            if (this.selectedMonth !== 'Todos') {
                const [month, year] = this.selectedMonth.split('/').map(s => parseInt(s));
                filteredData = filteredData.filter(d => {
                    return d.date.getMonth() + 1 === month && d.date.getFullYear() === year;
                });
            }

            if (this.filterStock !== '') {
                filteredData = filteredData.filter(d => {
                    return d.code.startsWith(this.filterStock);
                });
            }

            return filteredData;
        },
        totalNewOperation() {
            const price = this.newOperation.price ? NumberUtils.getNumberFromString(this.newOperation.price) : 0;
            const result = price * this.newOperation.quantity || 0;
            return NumberUtils.formatNumber(result, 'R$ ');
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
                    options: this.dataTable
                        .filter(o => !this.newOperation.institution || this.newOperation.institution === o.institution)
                        .map(o => o.account).distinct().sort(),
                    disable: this.isEdit
                },
                {
                    id: 'code',
                    label: 'Ativo',
                    type: 'text',
                    disable: this.isEdit
                },
                {
                    id: 'operation',
                    label: 'Operação',
                    type: 'select',
                    options: [{ label: 'Compra', value: 'C' }, { label: 'Venda', value: 'V' }],
                    disable: this.isEdit
                },
                {
                    id: 'date',
                    label: 'Data',
                    type: 'date',
                    disable: this.isEdit
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
                    id: 'price',
                    label: 'Preço',
                    type: 'text',
                    fillMask: '0',
                    mask: 'R$ #,##',
                    reverseFillMask: true
                }
            ];
        },
        splitFormFields() {
            return [
                {
                    id: 'code',
                    label: 'Ativo',
                    type: 'select',
                    options: this.dataTable.map(o => o.code).distinct().sort()
                },
                {
                    id: 'date',
                    label: 'Data',
                    type: 'date'
                },
                {
                    id: 'from',
                    label: 'De',
                    type: 'text',
                    fillMask: '0',
                    mask: '#',
                    reverseFillMask: true
                },
                {
                    id: 'to',
                    label: 'Para',
                    type: 'text',
                    fillMask: '0',
                    mask: '#',
                    reverseFillMask: true
                }
            ];
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            this.tableLoading = false;
            this.dataTable = arg.map(o => {
                o.date = new Date(o.date);
                return o;
            }).sort((s1, s2) => s2.date - s1.date);

            const monthSet = new Set(this.dataTable.map(d => {
                const date = d.date;
                return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString()}`;
            }));
            const monthArray = [...monthSet].sort((a, b) => {
                const sa = a.split('/').map(o => parseInt(o));
                const sb = b.split('/').map(o => parseInt(o));
                if (sa[1] === sb[1]) return sb[0] - sa[0];
                return sb[1] - sa[1];
            });
            this.months = ['Todos', ...monthArray];
        });

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

        ipcRenderer.on('stockHistory/create', (event, args) => {
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Operação adicionada com sucesso' });
                this.init();
            } else {
                this.$q.notify({ type: 'negative', message: args.error.message });
                console.error(args.error);
            }
        });

        ipcRenderer.on('stockHistory/update', (event, args) => {
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Operação editada com sucesso' });
                args.operation.date = new Date(args.operation.date);

                this.dataTable.forEach((o, i) => {
                    if (o.id === args.operation.id) {
                        this.dataTable[i].quantity = args.operation.quantity;
                        this.dataTable[i].price = args.operation.price;
                        this.dataTable[i].totalValue = args.operation.totalValue;
                    }
                });
            } else {
                this.$q.notify({ type: 'negative', message: args.error.message });
                console.error(args.error);
            }
        });

        ipcRenderer.on('stockHistory/refresh', (event, args) => {
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Histórico limpo. Buscando dados novamente...' });
                ipcRenderer.send('stockHistory/get');
            } else {
                this.$q.notify({ type: 'negative', message: args.error.message });
                console.error(args.error);
            }
        });

        ipcRenderer.on('stockHistory/split', (event, args) => {
            if (args.status === 'success') {
                this.$q.notify({ type: 'positive', message: `${args.count} operações splitadas com sucesso!` });
                ipcRenderer.send('stockHistory/get');
            } else {
                this.$q.notify({ type: 'negative', message: args.error.message });
                console.error(args.error);
            }
        });

        ipcRenderer.on('stockHistory/upload-csv', (event, args) => {
            this.tableLoading = false;
            if (args.status === 'success') {
                if (args.lines >= 0) {
                    this.$q.notify({ type: 'positive', message: `${args.lines} linha(s) processadas` });
                    this.init();
                }
            } else {
                this.$q.notify({ type: 'negative', message: args.message, actions: [{ icon: 'close', color: 'white' }], timeout: 10000 });
                console.error(args.error);
            }
        });

        ipcRenderer.on('stockHistory/sync-cei', (event, response) => {
            this.tableLoading = false;
            if (response.status === 'success') {
                this.init();
                this.$q.notify({ type: 'positive', message: 'Buscando dados do CEI...' });
            } else {
                this.$q.notify({ type: 'negative', message: 'Erro ao buscar no CEI' });
                console.error(response);
            }
        });

        ipcRenderer.on('stockHistory/finish-cei', (event, response) => {
            this.init();
        });

        this.init();
    }
};
</script>

<style lang="scss">

    .actions {
        text-align: right;
    }

</style>
