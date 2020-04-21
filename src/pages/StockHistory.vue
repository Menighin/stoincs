<template>
    <q-page class="">
        <div class="filter">
            <q-btn outline color="primary" :label="selectedMonth" class="q-my-lg" icon="eva-calendar-outline">
                <q-menu fit>
                    <q-list style="min-width: 100px">
                        <q-item @click="selectedMonth = month" clickable v-close-popup v-for="(month, i) in months" :key="`month-${i}`">
                            <q-item-section>{{ month }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
            <q-btn outline color="primary" label="Refresh" class="q-mx-sm" icon="eva-refresh" @click="refreshHistory"/>
        </div>

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
            :data="filteredDataTable"
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
                <h5 style="margin: 0">Histórico</h5>

                <q-space />

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

                <q-btn flat class="q-ma-sm" icon="eva-percent-outline" @click="split = {}; showSplitDialog = true" color="primary" />
                <q-btn flat class="q-ma-sm" icon="eva-plus-circle-outline" @click="showCreateDialog" color="primary" />
            </template>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat icon="eva-edit-2-outline" @click="editRow(props.row)" color="primary" />
                <q-btn flat icon="eva-trash-2-outline" @click="deleteRow(props.row)" color="primary" />
            </q-td>
        </q-table>

        <q-dialog v-model="showCreateForm" persistent>
            <q-card>
                <q-form @submit="saveOperation" class="q-gutter-md">
                    <q-card-section class="row items-center">
                        <div class="q-gutter-md q-ma-md" style="width: 400px; max-width: 500px">
                            <div class="text-h5">{{isEdit ? 'Editar Operação' : 'Nova Operação'}}</div>

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
                                @blur="() => newOperation.institution = newOperation.partialInstitution"
                                lazy-rules
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
                                @blur="() => newOperation.account = newOperation.partialAccount"
                                lazy-rules
                                :rules="[ val => val && val.length > 0 || '']"
                            />

                            <q-input :disable="isEdit" class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.institution" label="Instituição" lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                            <q-input :disable="isEdit" class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.account" label="Conta" lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                            <q-input :disable="isEdit" class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.code" label="Ativo" lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                            <q-select :disable="isEdit" :options="['C', 'V']" style="padding-bottom: 0" class="q-ma-sm" filled v-model="newOperation.operation" label="Operação" lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                            <q-input :disable="isEdit" class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.date" mask="##/##/####" label="Data"  lazy-rules :rules="[ val => val && val.length > 0 || '']">
                                <template v-slot:append>
                                    <q-icon name="event" class="cursor-pointer">
                                        <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                            <q-date mask="DD/MM/YYYY" v-model="newOperation.date" @input="() => $refs.qDateProxy.hide()" />
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                            <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.quantity" label="Quantidade" lazy-rules :rules="[ val => val && val != null ]" />
                            <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="newOperation.price" label="Preço" mask="R$ #,##" reverse-fill-mask lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                            <q-input class="q-ma-sm" style="padding-bottom: 0" filled :value="totalNewOperation" label="Total" disable />
                        </div>
                    </q-card-section>

                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" color="primary" v-close-popup />
                        <q-btn flat label="Salvar" type="submit" color="primary" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>

        <q-dialog v-model="showSplitDialog" persistent>
            <q-card>
                <q-form @submit="splitStocks" class="q-gutter-md">
                    <q-card-section class="row items-center">
                        <div class="q-gutter-md q-ma-md" style="width: 400px; max-width: 500px">
                            <q-card-section>
                                <div class="text-h5">Split de ações</div>
                                <q-select :disable="isEdit" :options="stockCodes" style="padding-bottom: 0" class="q-ma-sm" filled v-model="split.code" label="Ação" lazy-rules :rules="[ val => val && val.length > 0 || '']" />
                                <q-input :disable="isEdit" class="q-ma-sm" style="padding-bottom: 0" filled v-model="split.date" mask="##/##/####" label="Data"  lazy-rules :rules="[ val => val && val.length > 0 || '']">
                                    <template v-slot:append>
                                        <q-icon name="event" class="cursor-pointer">
                                            <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                                <q-date mask="DD/MM/YYYY" v-model="split.date" @input="() => $refs.qDateProxy.hide()" />
                                            </q-popup-proxy>
                                        </q-icon>
                                    </template>
                                </q-input>
                                <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="split.from" label="De" lazy-rules :rules="[ val => val && val != null ]" />
                                <q-input class="q-ma-sm" style="padding-bottom: 0" filled v-model="split.to" label="Para" lazy-rules :rules="[ val => val && val != null ]" />
                            </q-card-section>

                            <q-separator />

                            <q-card-section v-show="split.from && split.to">
                                Resultado: Uma operação de <strong>100</strong> papéis custando <strong>R$ 15,00</strong> cada, passará a ser uma operação de
                                <strong>{{ Math.floor(100 / (split.from / split.to)) }}</strong> papéis custando <strong>{{  NumberUtils.formatCurrency((15.00 * (split.from / split.to))) }}</strong> cada.
                            </q-card-section>
                        </div>
                    </q-card-section>
                    <q-card-actions align="right">
                        <q-btn flat label="Cancelar" color="primary" v-close-popup />
                        <q-btn flat label="Salvar" type="submit" color="primary" />
                    </q-card-actions>
                </q-form>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-electron/utils/NumberUtils';
import DateUtils from '../../src-electron/utils/DateUtils';

export default {
    name: 'PageStockHistory',
    data() {
        return {
            dataTable: [],
            months: ['Todos', '08/2018', '09/2018'],
            selectedMonth: 'Todos',
            tableLoading: false,
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
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'totalValue',
                    align: 'right',
                    label: 'Total',
                    field: 'totalValue',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
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
            split: {},
            filteredInstitutions: [],
            filteredAccounts: []
        };
    },
    methods: {
        showCreateDialog() {
            this.newOperation = {};
            this.isEdit = false;
            this.showCreateForm = true;
        },
        deleteRow(row) {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Tem certeza que deseja remover esta operação?',
                cancel: true,
                persistent: true
            }).onOk(() => {
                ipcRenderer.send('stockHistory/delete', row.id);
            });
        },
        editRow(row) {
            this.isEdit = true;
            this.newOperation.id = row.id;
            this.newOperation.institution = row.institution;
            this.newOperation.account = row.account;
            this.newOperation.code = row.code;
            this.newOperation.operation = row.operation;
            this.newOperation.date = row.date.toJSON();
            this.newOperation.quantity = row.quantity;
            this.newOperation.price = `R$ ${row.price.toFixed(2).replace('.', ',')}`;

            this.showCreateForm = true;
        },
        saveOperation() {
            const payload = {
                ...this.newOperation,
                totalValue: NumberUtils.getNumberFromCurrency(this.totalNewOperation),
                date: this.isEdit ? new Date(this.newOperation.date) : DateUtils.fromDateStr(this.newOperation.date),
                price: NumberUtils.getNumberFromCurrency(this.newOperation.price),
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
            console.log('payload', payload);
            ipcRenderer.send('stockHistory/split', payload);
            this.showSplitDialog = false;
        },
        refreshHistory() {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Essa ação irá remover todo o histórico do CEI e importá-lo novamente do site. Tem certeza que deseja continuar?',
                cancel: true,
                persistent: true
            }).onOk(() => {
                ipcRenderer.send('stockHistory/refresh');
            });
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
                    this.filteredAccounts = this.accountsOptions;
                } else {
                    const needle = val.toLowerCase();
                    this.filteredAccounts = this.accountsOptions.filter(
                        v => v.toLowerCase().indexOf(needle) > -1
                    );
                }
            });
        }
    },
    computed: {
        filteredDataTable() {
            if (this.selectedMonth === 'Todos') {
                return this.dataTable;
            } else {
                const [month, year] = this.selectedMonth.split('/').map(s => parseInt(s));
                return this.dataTable.filter(d => {
                    return d.date.getMonth() + 1 === month && d.date.getFullYear() === year;
                });
            }
        },
        kpis() {
            const bought = this.filteredDataTable
                .filter(o => o.operation === 'C')
                .reduce((p, c) => p + c.totalValue, 0);

            const sold = this.filteredDataTable
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
        },
        totalNewOperation() {
            const price = this.newOperation.price ? NumberUtils.getNumberFromCurrency(this.newOperation.price) : 0;
            const result = price * this.newOperation.quantity || 0;
            return NumberUtils.formatCurrency(result);
        },
        stockCodes() {
            const stocks = {};
            for (const stock of this.dataTable) {
                stocks[stock.code] = 1;
            }
            return Object.keys(stocks).sort();
        },
        institutionOptions() {
            return [...new Set(this.dataTable.map(o => o.institution).sort())];
        },
        accountOptions() {
            const data = this.dataTable
                .filter(o => !this.newOperation.institution || this.newOperation.institution === o.institution)
                .map(o => o.account)
                .sort();
            return [...new Set(data)];
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            this.dataTable = arg.reduce((p, c, i) => {
                p = [...p, ...c.stockHistory.map(s => ({
                    ...s,
                    date: new Date(s.date),
                    institution: c.institution,
                    account: c.account
                }))];
                return p;
            }, []).sort((s1, s2) => s1.date - s2.date);

            const monthSet = new Set(this.dataTable.map(d => {
                const date = d.date;
                return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString()}`;
            }));
            const monthArray = [...monthSet].sort((a, b) => {
                const sa = a.split('/').map(o => parseInt(o));
                const sb = b.split('/').map(o => parseInt(o));
                if (sa[1] === sb[1]) return sa[0] - sb[0];
                return sa[1] - sb[1];
            });
            this.months = ['Todos', ...monthArray];
        });
        ipcRenderer.send('stockHistory/get');

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
                args.operation.date = new Date(args.operation.date);
                this.dataTable.push(args.operation);
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
