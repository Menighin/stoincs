<template>
    <q-page class="">
        <div class="filter">
            <q-btn outline color="primary" label="Sincronizar com Histórico" class="q-mx-sm q-my-lg" icon="eva-sync-outline" @click="downloadFromHistory"/>
            <q-btn outline color="primary" class="q-mx-sm q-my-lg" icon="eva-settings-2-outline" @click="configDialog = true"/>
        </div>

        <q-table
            class="table-container q-mx-lg"
            table-class="stock-table"
            title="Carteira de ações"
            :data="filteredDataTable"
            :columns="columns"
            row-key="row => row.code"
            flat
            bordered
            :rows-per-page-options="[50, 100, 150]"
            rows-per-page-label="Items por página"
            :pagination.sync="pagination"
            :visible-columns="visibleColumns"
            :loading="tableLoading"
        >
            <template v-slot:top>
                <h5 style="margin: 0">Carteira de Ações</h5>

                <q-space />

                <q-checkbox v-model="withBalanceOnly" label="Somente ações com saldo" />

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
            </template>

            <q-td auto-width slot="body-cell-price" slot-scope="props" :props="props">
                <q-spinner v-if="props.row.code in loadingStocks" color="primary" size="12px" />
                <div class="q-pl-sm price-cell" :class="{ 'updating-price': props.row.code in loadingStocks, 'value-up': props.row.changePrice > 0, 'value-down': props.row.changePrice < 0 }">
                    {{ NumberUtils.formatCurrency(props.row.price) }}
                    <div class="variation" v-if="configuration.variation === 'price'">{{ NumberUtils.formatCurrency(props.row.changePrice, true) }}</div>
                    <div class="variation" v-if="configuration.variation === 'percentage'">{{ NumberUtils.formatPercentage(props.row.changePercent) }}</div>
                </div>
            </q-td>

            <q-td auto-width slot="body-cell-lastUpdated" slot-scope="props" :props="props">
                {{ props.row.lastUpdated ? `${DateUtils.getFormatedHoursFromSeconds(parseInt((new Date() - new Date(props.row.lastUpdated)) / 1000), true, true, false) }` : null }}
            </q-td>

            <q-td auto-width slot="body-cell-totalValue" slot-scope="props" :props="props" :class="{ 'value-up': props.row.totalValue > 0, 'value-down': props.row.totalValue < 0 }">
                {{ NumberUtils.formatCurrency(props.row.totalValue) }}
            </q-td>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat icon="eva-sync-outline" @click="syncRow(props.row)" title="Atualizar" color="primary" />
                <q-btn flat icon="eva-pricetags-outline" @click="editLabelDialog = true; editLabelCode = props.row.code; editLabel = props.row.label; partialEditLabel = ''" title="Editar label" color="primary" />
            </q-td>
        </q-table>

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
                <q-card-section class="row q-ma-sm justify-between items-center">
                    <div class="text-h6">Configurações</div>
                </q-card-section>

                <q-separator />

                <q-card-section style="max-height: 80vh" class="scroll">
                    <q-card-section>
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
import NumberUtils from '../../src-electron/utils/NumberUtils';
import DateUtils from '../../src-electron/utils/DateUtils';

export default {
    name: 'PageWallet',
    data() {
        return {
            data: [],
            now: new Date(),
            loadingStocks: {},
            configuration: {
                variation: 'percentage'
            },
            tableLoading: false,
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
            visibleColumns: [ 'code', 'quantityBought', 'quantitySold', 'quantityBalance', 'valueBought', 'valueSold', 'lastUpdated', 'price', 'totalValue', 'label' ],
            columns: [
                {
                    name: 'code',
                    align: 'center',
                    label: 'Ativo',
                    field: 'code',
                    sortable: true
                },
                {
                    name: 'quantityBought',
                    align: 'right',
                    label: 'Qt. Comprada',
                    field: 'quantityBought',
                    sortable: true
                },
                {
                    name: 'quantitySold',
                    align: 'right',
                    label: 'Qt. Vendida',
                    field: 'quantitySold',
                    sortable: true
                },
                {
                    name: 'quantityBalance',
                    align: 'right',
                    label: 'Qt. Saldo',
                    field: 'quantityBalance',
                    sortable: true
                },
                {
                    name: 'valueBought',
                    align: 'right',
                    label: 'Valor Investido',
                    field: 'valueBought',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'valueSold',
                    align: 'right',
                    label: 'Valor Resgatado',
                    field: 'valueSold',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'price',
                    align: 'right',
                    label: 'Último Valor',
                    field: 'price',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'lastUpdated',
                    align: 'center',
                    label: 'Atualizado a',
                    field: 'lastUpdated',
                    format: val => val ? DateUtils.toString(new Date(val)) : null
                },
                {
                    name: 'totalValue',
                    align: 'right',
                    label: 'Valor Acumulado',
                    field: 'totalValue',
                    sortable: true,
                    format: val => NumberUtils.formatCurrency(val)
                },
                {
                    name: 'label',
                    align: 'center',
                    label: 'Label',
                    field: 'label',
                    sortable: true
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
            newOperation: {
            },
            NumberUtils: NumberUtils,
            DateUtils: DateUtils,
            updatePricesInterval: null,
            shouldUpdateInterval: false,
            updateSlice: [],
            withBalanceOnly: true,
            tickInterval: null
        };
    },
    methods: {
        downloadFromHistory() {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Tem certeza que deseja continuar?',
                cancel: true,
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
            const config = localStorage.getItem('wallet/config');
            if (config)
                this.configuration = JSON.parse(config);
        },
        syncRow(row) {
            this.$set(this.loadingStocks, row.code, 1);
            ipcRenderer.send('wallet/update-last-value', { stocks: [row.code], type: 'manual' });
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
        }
    },
    computed: {
        dataTable() {
            return this.data
                .map(d => {
                    const quantityBalance = Math.max(d.quantityBought - d.quantitySold, 0);
                    return {
                        code: d.code,
                        quantityBought: d.quantityBought,
                        quantitySold: d.quantitySold,
                        quantityBalance: quantityBalance,
                        valueBought: d.valueBought,
                        valueSold: d.valueSold,
                        price: d.price,
                        changePrice: d.changePrice,
                        changePercent: d.changePercent,
                        lastTradingDay: d.lastTradingDay,
                        lastUpdated: d.lastUpdated,
                        totalValue: d.valueSold + quantityBalance * d.price - d.valueBought,
                        source: d.source,
                        label: d.label
                    };
                })
                .sort((a, b) => a.code < b.code ? -1 : (a.code > b.code ? 1 : 0));
        },
        filteredDataTable() {
            if (this.withBalanceOnly)
                return this.dataTable.filter(o => o.quantityBalance > 0);
            else
                return this.dataTable;
        },
        configSummary() {
            if (this.configuration.which === 'none') {
                return ['Nenhum valor de ação será atualizado automaticamente'];
            }

            let many = this.dataTable.length;
            if (this.configuration.which === 'balance') {
                many = this.dataTable.filter(d => d.quantityBalance > 0).length;
            }

            const interval = (Math.max(1, many / this.configuration.many) * this.configuration.when).toFixed(2);
            const ticksPerHour = 60 / this.configuration.when;
            const updatesPerHour = parseInt(Math.ceil(ticksPerHour * Math.min(this.configuration.many, many)));

            const msgs = [`<strong>${many}</strong> ações serão atualizadas.`];
            msgs.push(`A cada <strong>${DateUtils.getFormatedHoursFromSeconds(this.configuration.when * 60, true, true, false)}</strong>, <strong>${this.configuration.many}</strong> ações serão atualizadas.`);
            msgs.push(`Isso significa que uma mesma ação será atualizada a cada <strong>${DateUtils.getFormatedHoursFromSeconds(interval * 60, true, true, false)}</strong>.`);
            msgs.push(`Serão <strong>${updatesPerHour}</strong> atualizações por hora, totalizando <strong>${updatesPerHour * 24}</strong> atualizações por dia.`);

            return msgs;
        },
        labelOptions() {
            return [...new Set(this.dataTable.map(o => o.label).filter(o => o && o.length > 0))].sort();
        }
    },
    mounted() {
        ipcRenderer.on('wallet/get', (event, response) => {
            if (response.status === 'success') {
                this.data = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao ler sua carteira: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('wallet/refresh-from-history', (event, response) => {
            if (response.status === 'success') {
                this.init();
                this.$q.notify({ type: 'positive', message: `Sua carteira foi atualizada!` });
            } else {
                this.$q.notify({ type: 'negative', message: `Error pegar carteira do seu histórico: ${response.error.message}` });
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

        ipcRenderer.on('wallet/updating', (event, response) => {
            for (const stock of response.data)
                this.$set(this.loadingStocks, stock, 1);
        });

        ipcRenderer.on('wallet/update-last-value', (event, response) => {
            for (const s of response.data)
                delete this.loadingStocks[s.code];

            // Update successfull updates
            for (const r of response.data.filter(o => o.status === 'success')) {
                for (const d of this.data) {
                    if (r.code === d.code) {
                        d.price = r.price;
                        d.changePrice = r.changePrice;
                        d.changePercent = r.changePercent;
                        d.lastTradingDay = r.lastTradingDay;
                        d.lastUpdated = r.lastUpdated;
                        break;
                    }
                }
            }

            // Prompt errors
            for (const r of response.data.filter(o => o.status === 'error')) {
                this.$q.notify({ type: 'negative', message: `${r.code}: ${r.errorMessage}` });
            }
        });

        this.init();
    },
    beforeDestroy() {
        clearInterval(this.updatePricesInterval);
        clearInterval(this.tickInterval);
    }
};
</script>

<style lang="scss">

    .filter {
        text-align: right;
    }

    .table-container {

        .q-table__middle {
            max-height: 700px;
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

                    .value-up {
                        color: #21BA45;
                    }

                    .value-down {
                        color: #C10015;
                    }

                    tr:nth-child(odd) {
                        background: #f7f7f7;
                    }
                }
            }

        }
    }

</style>
