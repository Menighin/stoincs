<template>
    <q-page class="wallet-page q-px-lg q-py-lg">

        <group-header-table
            class="table-container q-mx-lg"
            table-class="data-table sticky-last-column"
            title="Carteira de ações"
            :data="dataTable"
            :columns="columns"
            :row-key="row => row.code"
            flat
            bordered
            :rows-per-page-options="[50, 100, 150]"
            rows-per-page-label="Items por página"
            :pagination.sync="pagination"
            :visible-columns="visibleColumns"
            :loading="tableLoading"
            ref="table"
            v-dynamic-height="{ heightOffset: 250, innerSelector: '.q-table__middle' }"
        >
            <template v-slot:top>
                <h5 style="margin: 0 5px 0 0">Carteira de Ações</h5>
                <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                    <q-menu anchor="bottom right" self="top right" content-class="q-pa-sm">
                        Contém as informações de todos os ativos que você possui saldo de acordo com as suas negociações na tela de <strong>Extrato</strong>.<br />As colunas são:<br />
                        <ul>
                            <li><strong>Ativo</strong>: Código do ativo no carteira</li>
                            <li><strong>Quantidade</strong>: Quantidade do ativo na carteira</li>
                            <li><strong>Valor</strong>: Valor em R$ do ativo na sua carteira calculado por <i>Quantidade x Preço</i></li>
                            <li><strong>Preço Médio de Compra</strong>: Preço médio da compra de um ativo, dado o seu extrato de negociações</li>
                            <li><strong>Preço Atual</strong>: Preço atual do ativo. Para que ele seja atualizado você deve incluir o ativo na tela de preços ou nas configurações</li>
                            <li><strong>Atualizado a</strong>: Tempo desde a ultima atualização do preço do ativo</li>
                            <li><strong>Posição histórica</strong>: Dado seu histórico de negociações e o preço atual do ativo, calcula sua posição atual se vendesse o ativo nesse momento</li>
                            <li><strong>Label</strong>: Label utilizado para categorizar o ativo nos gráficos</li>
                        </ul>
                    </q-menu>
                </q-icon>

                <q-space />

                <q-btn flat color="primary" label="Reprocessar" icon="eva-sync-outline" @click="downloadFromHistory"/>

                <q-select
                    v-model="visibleColumns"
                    multiple
                    outlined
                    dense
                    options-dense
                    :display-value="`Colunas (${visibleColumns.length}/${columns.length - 1})`"
                    emit-value
                    map-options
                    :options="columns.filter(o => o.name != 'action')"
                    @input="changeVisibleColumns"
                    option-value="name"
                    options-cover
                    style="min-width: 150px"
                    class="q-ma-sm"
                />

                <q-btn flat color="primary" icon="eva-settings-2-outline" @click="configDialog = true"/>

            </template>

            <q-td auto-width slot="body-cell-price" slot-scope="props" :props="props">
                <div class="q-pl-sm price-cell" v-if="!editingStockPrice[props.row.code]" :class="{ 'updating-price': loadingStocks[props.row.code], 'value-up': props.row.changePrice > 0, 'value-down': props.row.changePrice < 0 }">
                    {{ NumberUtils.formatNumber(props.row.price, 'R$ ') }}
                    <div class="variation" v-if="configuration.variation === 'price'">{{ NumberUtils.formatNumber(props.row.changePrice, 'R$ ', '', true) }}</div>
                    <div class="variation" v-if="configuration.variation === 'percentage'">{{ NumberUtils.formatNumber(props.row.changePercent, '', '%', true) }}</div>
                </div>
                <q-input
                    borderless
                    mask="R$ #,##" reverse-fill-mask
                    fill-mask="0"
                    type="text"
                    v-model="newPrice"
                    placeholder="Preço"
                    ref="editPriceRef"
                    class="q-pa-none edit-price-input"
                    @keydown.enter="saveStockPrice(props.row.code)"
                    @keydown.esc="cancelStockPriceEdit(props.row.code)"
                    @keydown.tab="saveAndEditNextRow(props, $event)"
                    @blur="cancelStockPriceEdit(props.row.code)"
                    v-if="editingStockPrice[props.row.code]">
                </q-input>
                <q-spinner v-if="loadingStocks[props.row.code]" color="primary" size="12px" class="update-price" />
                <q-btn v-if="!loadingStocks[props.row.code] && !editingStockPrice[props.row.code]" icon="eva-edit-outline" flat round size="12px" color="primary" class="edit-price" @click="editPrice(props.row.code)" />
            </q-td>

            <q-td auto-width slot="body-cell-lastUpdated" slot-scope="props" :props="props">
                {{ props.row.lastUpdated ? `${DateUtils.getFormatedHoursFromSeconds(parseInt((new Date() - new Date(props.row.lastUpdated)) / 1000), true, true, false) }` : null }}
            </q-td>

            <q-td auto-width slot="body-cell-apiUpdate" slot-scope="props" :props="props">
                {{ props.row.apiUpdate ? `${DateUtils.getFormatedHoursFromSeconds(parseInt((new Date() - new Date(props.row.apiUpdate)) / 1000), true, true, false) }` : null }}
            </q-td>

            <q-td auto-width slot="body-cell-openPosition" slot-scope="props" :props="props" :class="{ 'value-up': props.row.openPosition > 0, 'value-down': props.row.openPosition < 0 }">
                {{ NumberUtils.formatNumber(props.row.openPosition, 'R$ ') }}
                <div class="variation">{{ NumberUtils.formatNumber(props.row.openVariation, '', '%', true) }}</div>
            </q-td>

            <q-td auto-width slot="body-cell-historicPosition" slot-scope="props" :props="props" :class="{ 'value-up': props.row.historicPosition > 0, 'value-down': props.row.historicPosition < 0 }">
                {{ NumberUtils.formatNumber(props.row.historicPosition, 'R$ ') }}
                <div class="variation">{{ NumberUtils.formatNumber(props.row.historicVariation, '', '%', true) }}</div>
            </q-td>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat round class="q-ma-none" icon="eva-sync-outline" @click="syncRow(props.row)" title="Atualizar" color="primary" size="10px" />
                <q-btn flat round class="q-ma-none" icon="eva-pricetags-outline" size="10px" @click="editLabelDialog = true; editLabelCode = props.row.code; editLabel = props.row.label; partialEditLabel = ''" title="Editar label" color="primary" />
            </q-td>

            <template v-slot:no-data="">
                <div class="full-width text-center q-gutter-sm no-data" style="padding: 60px 0" v-if="!tableLoading">
                    <h5> Você ainda não possui dados para esta tabela <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
                    <span>
                        Sincronize com o seu histórico para processar sua carteira.
                    </span>
                </div>
            </template>
        </group-header-table>

        <q-dialog v-model="editLabelDialog">
            <q-card style="min-width: 550px">
                <q-card-section class="row q-ma-sm justify-between items-center">
                    <div class="text-h6">Editar label para {{ editLabelCode }}</div>
                </q-card-section>
                <q-separator />
                <q-card-section style="max-height: 80vh" class="scroll">

                    <q-item-label header>Label do ativo</q-item-label>
                    <q-select
                        filled
                        v-model="editLabel"
                        use-input
                        clearable
                        @new-value="createLabelOption"
                        :options="filteredLabelOptions"
                        @filter="filterLabelFn"
                        @input-value="partialCreateLabelOption"
                        @blur="createLabelOption(partialEditLabel)"
                    />

                </q-card-section>
                <q-separator />
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="primary" v-close-popup />
                    <q-btn flat label="Salvar" color="primary" @click="saveLabel" />
                </q-card-actions>

            </q-card>
        </q-dialog>

        <q-dialog v-model="configDialog">
            <q-card class="q-pb-lg" style="min-width: 550px">
                <q-card-section class="row q-ma-none justify-between items-center">
                    <div class="text-h5">Configurações</div>
                </q-card-section>

                <q-separator />

                <q-card-section style="max-height: 80vh" class="scroll">
                    <q-card-section>
                        <div class="text-h6">Preços</div>
                        <q-checkbox label="Atualizar preços automaticamente" v-model="autoUpdatePrices" @input="autoUpdatePricesChange" />

                        <div class="text-h6">Visualização</div>
                        <q-item-label header>Como devem ser exibidas as variações de valor?</q-item-label>
                        <q-radio @input="saveConfig" v-model="configuration.variation" val="price" label="Reais" />
                        <q-radio @input="saveConfig" v-model="configuration.variation" val="percentage" label="Porcentagem" />
                    </q-card-section>
                </q-card-section>

            </q-card>
        </q-dialog>
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-shared/utils/NumberUtils';
import DateUtils from '../../src-shared/utils/DateUtils';
import GroupHeaderTable from '../components/GroupHeaderTable';

export default {
    name: 'PageWallet',
    components: {
        GroupHeaderTable
    },
    data() {
        return {
            now: new Date(),
            loadingStocks: {},
            editingStockPrice: {},
            wallet: [],
            stockPrices: {},
            consolidated: {},
            configuration: {
                variation: 'percentage'
            },
            tableLoading: true,
            showCreateForm: false,
            configDialog: false,
            editLabelDialog: false,
            editLabelCode: '',
            editLabel: '',
            partialEditLabel: null,
            filteredLabelOptions: [],
            pagination: {
                rowsPerPage: 50
            },
            visibleColumns: [ 'code', 'quantity', 'value', 'historicAverageBuyPrice', 'price', 'lastUpdated', 'historicPosition', 'label' ],
            columns: [
                {
                    name: 'code',
                    align: 'center',
                    label: 'Ativo',
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
                    name: 'price',
                    align: 'right',
                    label: 'Preço Atual',
                    field: 'price',
                    sortable: true,
                    headerStyle: 'padding-right: 54px',
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'value',
                    align: 'right',
                    label: 'Valor',
                    field: 'value',
                    sortable: true,
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'openAverageBuyPrice',
                    align: 'right',
                    label: 'Pç Médio Compra',
                    field: 'openAverageBuyPrice',
                    sortable: true,
                    width: 50,
                    groupHeader: 'Operação Corrente',
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'openPosition',
                    align: 'right',
                    label: 'Posição',
                    field: 'openPosition',
                    width: 50,
                    groupHeader: 'Operação Corrente',
                    sortable: true
                },
                {
                    name: 'historicAverageBuyPrice',
                    align: 'right',
                    label: 'Pç Médio Compra',
                    field: 'historicAverageBuyPrice',
                    sortable: true,
                    width: 50,
                    groupHeader: 'Histórico',
                    format: val => NumberUtils.formatNumber(val, 'R$ ')
                },
                {
                    name: 'historicPosition',
                    align: 'right',
                    label: 'Posição',
                    field: 'historicPosition',
                    width: 50,
                    groupHeader: 'Histórico',
                    sortable: true
                },
                {
                    name: 'lastUpdated',
                    align: 'center',
                    label: 'Atualizado a',
                    field: 'lastUpdated',
                    format: val => val ? DateUtils.toString(new Date(val)) : null
                },
                {
                    name: 'apiUpdate',
                    align: 'center',
                    label: 'Ultima atualização API',
                    field: 'apiUpdate',
                    format: val => val ? DateUtils.toString(new Date(val)) : null
                },
                {
                    name: 'label',
                    align: 'center',
                    label: 'Label',
                    field: 'label',
                    sortable: true
                },
                {
                    name: 'action',
                    align: 'center',
                    label: 'Ações',
                    field: 'action',
                    required: true,
                    alwaysShow: true
                }
            ],
            newOperation: {
            },
            NumberUtils: NumberUtils,
            DateUtils: DateUtils,
            updateSlice: [],
            autoUpdatePrices: false,
            newPrice: ''
        };
    },
    methods: {
        downloadFromHistory() {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Essa ação irá reprocessar os dados da sua carteira de acordo com seu histórico de negociações. Tem certeza que deseja continuar?',
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
                ipcRenderer.send('wallet/refresh-from-history');
            });
        },
        saveConfig() {
            localStorage.setItem('wallet/config', JSON.stringify(this.configuration));
        },
        init() {
            ipcRenderer.send('wallet/get');
            ipcRenderer.send('stock-prices/get');
            ipcRenderer.send('stockHistory/consolidated');
            ipcRenderer.send('configuration/get');
            const config = localStorage.getItem('wallet/config');
            if (config)
                this.configuration = JSON.parse(config);
        },
        syncRow(row) {
            this.$set(this.loadingStocks, row.code, 1);
            ipcRenderer.send('stock-prices/auto-update', { stocks: [row.code] });
        },
        filterLabelFn(val, update) {
            update(() => {
                if (val === '') {
                    this.filteredLabelOptions = this.labelOptions;
                } else {
                    const needle = val.toLowerCase();
                    this.filteredLabelOptions = this.labelOptions.filter(
                        v => v.toLowerCase().indexOf(needle) > -1
                    );
                }
            });
        },
        createLabelOption(val, done) {
            if (val.length > 0) {
                if (done)
                    done(val, 'toggle');
                else
                    this.editLabel = val;
            }
        },
        partialCreateLabelOption(val) {
            this.partialEditLabel = val;
        },
        saveLabel() {
            ipcRenderer.send('wallet/update-label', { stock: this.editLabelCode, label: this.editLabel });
            this.editLabel = '';
            this.editLabelDialog = false;
        },
        autoUpdatePricesChange() {
            ipcRenderer.send('configuration/auto-update-price', { autoUpdate: this.autoUpdatePrices });
        },
        async editPrice(code) {
            this.$set(this.editingStockPrice, code, 1);
            if (this.stockPrices[code])
                this.newPrice = this.stockPrices[code].price.toFixed(2).toString().replace('.', ',');
            else
                this.newPrice = '0,00';
            await this.$nextTick();
            this.$refs.editPriceRef.select();
        },
        saveStockPrice(code) {
            if (!this.stockPrices[code])
                this.$set(this.stockPrices, code, {});
            this.stockPrices[code].price = NumberUtils.getNumberFromString(this.newPrice);
            this.stockPrices[code].changePrice = null;
            this.stockPrices[code].changePercent = null;
            this.stockPrices[code].lastUpdated = new Date();
            this.newPrice = '';
            this.$set(this.editingStockPrice, code, 0);
            ipcRenderer.send('stock-prices/update-stock-price', { code: code, stockPrice: this.stockPrices[code] });
        },
        async editNextStockPrice(index) {
            const table = this.$refs.table;
            const nextRow = table.filteredSortedRows[(index + 1) % table.filteredSortedRows.length];
            await this.editPrice(nextRow.code);
        },
        cancelStockPriceEdit(code) {
            this.newPrice = '';
            this.$set(this.editingStockPrice, code, 0);
        },
        changeVisibleColumns() {
            localStorage.setItem('wallet/columns', JSON.stringify(this.visibleColumns));
        },
        saveAndEditNextRow(props, event) {
            event.preventDefault();
            this.saveStockPrice(props.row.code);
            this.editNextStockPrice(props.rowIndex);
        }
    },
    computed: {
        dataTable() {
            return this.wallet.map(w => {
                const consolidatedStock = this.consolidated[w.code];
                const price = this.stockPrices[w.code] ? this.stockPrices[w.code].price : 0;
                const currentValue = w.quantity * price;

                const historicPosition = consolidatedStock ? consolidatedStock.valueSold + currentValue - consolidatedStock.valueBought : 0;
                const historicVariation = consolidatedStock && consolidatedStock.valueBought ? historicPosition / consolidatedStock.valueBought : 0;
                const historicAverageBuyPrice = consolidatedStock && consolidatedStock.historicInfo.averageBuyPrice ? consolidatedStock.historicInfo.averageBuyPrice : 0;

                const openAverageBuyPrice = consolidatedStock && consolidatedStock.openOperation ? consolidatedStock.openOperation.averageBuyPrice : 0;
                const openValueBought = consolidatedStock && consolidatedStock.openOperation ? w.quantity * consolidatedStock.openOperation.averageBuyPrice : 0;
                const openPosition = consolidatedStock && consolidatedStock.openOperation ? currentValue - openValueBought : 0;
                const openVariation = openValueBought !== 0 ? openPosition / openValueBought * 100 : 0;
                return {
                    ...w,
                    value: currentValue,
                    price: price,
                    changePrice: this.stockPrices[w.code] ? this.stockPrices[w.code].changePrice : 0,
                    changePercent: this.stockPrices[w.code] ? this.stockPrices[w.code].changePercent : 0,
                    lastUpdated: this.stockPrices[w.code] ? this.stockPrices[w.code].lastUpdated : null,
                    apiUpdate: this.stockPrices[w.code] ? this.stockPrices[w.code].apiUpdate : null,
                    historicAverageBuyPrice: historicAverageBuyPrice,
                    historicPosition: historicPosition,
                    historicVariation: historicVariation * 100,
                    openAverageBuyPrice: openAverageBuyPrice,
                    openPosition: openPosition,
                    openVariation: openVariation
                };
            });
        },
        labelOptions() {
            return [...new Set(this.dataTable.map(o => o.label).filter(o => o && o.length > 0))].sort();
        }
    },
    mounted() {
        ipcRenderer.on('wallet/get', (event, response) => {
            this.tableLoading = false;
            if (response.status === 'success') {
                this.wallet = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar carteira` });
                console.error(response);
            }
        });

        ipcRenderer.on('stock-prices/get', (event, response) => {
            if (response.status === 'success') {
                this.stockPrices = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar preços de ativos` });
                console.error(response);
            }
        });

        ipcRenderer.on('stockHistory/consolidated', (event, response) => {
            if (response.status === 'success') {
                this.consolidated = response.data.reduce((p, c) => { p[c.code] = c; return p }, {});
                console.log(this.consolidated);
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar dados consolidados` });
                console.error(response);
            }
        });

        ipcRenderer.on('wallet/refresh-from-history', (event, response) => {
            if (response.status === 'success') {
                this.init();
                this.$q.notify({ type: 'positive', message: `Sua carteira foi atualizada!` });
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar carteira do seu histórico: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('wallet/update-label', (event, response) => {
            if (response.status === 'success') {
                this.init();
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao ler sua carteira: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('stock-prices/updating', (event, response) => {
            for (const stock of response.data) {
                this.$set(this.loadingStocks, stock, 1);
                this.cancelStockPriceEdit(stock);
            }
        });

        ipcRenderer.on('stock-prices/auto-update', (event, response) => {
            for (const s of response.data)
                this.$set(this.loadingStocks, s.code, 0);

            // Update successfull updates
            for (const r of response.data.filter(o => o.status === 'success')) {
                if (!this.stockPrices[r.code]) this.$set(this.stockPrices, r.code, {});
                this.stockPrices[r.code].price = r.price;
                this.stockPrices[r.code].changePrice = r.changePrice;
                this.stockPrices[r.code].changePercent = r.changePercent;
                this.stockPrices[r.code].apiUpdate = r.apiUpdate;
                this.stockPrices[r.code].lastUpdated = r.lastUpdated;
            }

            // Prompt errors
            for (const r of response.data.filter(o => o.status === 'error')) {
                this.$q.notify({ type: 'negative', message: `${r.code}: ${r.errorMessage}` });
            }
        });

        ipcRenderer.on('configuration/get', (event, response) => {
            if (response.status === 'success') {
                const priceUpdate = response.data.priceUpdate || {};
                this.autoUpdatePrices = priceUpdate.auto || false;
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao ler suas configurações: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('configuration/auto-update-price', (event, response) => {
            if (response.status === 'success') {
                this.$q.notify({ type: 'positive', message: `Atualização automática de preços atualizada!` });
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao ler suas configurações: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('stock-prices/update-stock-price', (event, response) => {
            if (response.status === 'success') {
                this.$q.notify({ type: 'positive', message: `Preço atualizado com suceso!` });
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao salvar preço: ${response.error.message}` });
                console.error(response.error);
            }
        });

        if (localStorage.getItem('wallet/columns'))
            this.visibleColumns = JSON.parse(localStorage.getItem('wallet/columns'));

        this.init();
    },
    beforeDestroy() {
    }
};
</script>

<style lang="scss">

    .wallet-page {
        .filter {
            text-align: right;
        }

        .table-container {

            .q-table__middle {
                max-height: 700px;
            }

            .data-table {
                table {
                    tbody {
                        .price-cell {
                            display: inline-block;
                            vertical-align: middle;

                            &.updating-price {
                                color: #aaa !important;
                            }

                            .variation {
                                font-size: 10px;
                            }
                        }

                        .edit-price-input {
                            height: 12px;
                            input {
                                text-align: right;
                                padding-right: 38px;
                                font-size: 13px;
                            }
                        }

                        .update-price {
                            margin: 12px;
                        }
                    }
                }

            }
        }
    }

</style>
