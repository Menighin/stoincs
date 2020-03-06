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

                <q-btn flat class="q-ma-sm" icon="eva-plus-circle-outline" @click="showCreateForm = true" color="primary" />
            </template>

            <q-td auto-width slot="body-cell-price" slot-scope="props" :props="props">
                <q-spinner v-if="props.row.code in loadingStocks" color="primary" size="12px" />
                <div class="q-pl-sm price-cell" :class="{ 'updating-price': props.row.code in loadingStocks, 'price-up': props.row.changePrice > 0, 'price-down': props.row.changePrice < 0 }">
                    {{ NumberUtils.formatCurrency(props.row.price) }}
                    <div class="variation" v-if="configuration.variation === 'price'">{{ NumberUtils.formatCurrency(props.row.changePrice, true) }}</div>
                    <div class="variation" v-if="configuration.variation === 'percentage'">{{ NumberUtils.formatPercentage(props.row.changePercent) }}</div>
                </div>
            </q-td>

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat icon="eva-trash-2-outline" @click="deleteRow(props.row)" color="primary" />
            </q-td>
        </q-table>

        <q-dialog v-model="configDialog">
            <q-card class="q-pb-lg" style="min-width: 550px">
                <q-card-section class="row q-ma-sm justify-between items-center">
                    <div class="text-h6">Configurações</div>
                    <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                        <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
                            A API grátis da Alpha Vantage é limitada a 5 requisições por minuto e 500 requisições diárias.<br />
                            Caso esteja usando uma chave grátis da API, tenha cuidado para não ficar sem requisições. <br />
                            O quadro de resumo te auxilia a encontrar os melhores parametros para utilizar a atualização automatica dos valores.
                        </q-menu>
                    </q-icon>
                </q-card-section>

                <q-separator />

                <q-card-section style="max-height: 80vh" class="scroll">

                    <q-card-section>
                        <div class="text-h6">Visualização</div>
                        <q-item-label header>Como devem ser exibidas as variações de valor?</q-item-label>
                        <q-radio @input="saveConfig" v-model="configuration.variation" val="price" label="Reais" />
                        <q-radio @input="saveConfig" v-model="configuration.variation" val="percentage" label="Porcentagem" />
                    </q-card-section>

                    <q-separator />

                    <q-card-section>
                        <div class="text-h6">Atualização de preços</div>

                        <q-item-label header>Quais ações devem ter o valor atualizado?</q-item-label>
                        <q-radio @input="saveConfig" v-model="configuration.which" val="all" label="Todas" />
                        <q-radio @input="saveConfig" v-model="configuration.which" val="balance" label="As que possuem saldo" />
                        <q-radio @input="saveConfig" v-model="configuration.which" val="none" label="Nenhuma" />

                        <q-item-label header>Quantas ações devem ser atualizadas por tick?</q-item-label>
                        <q-input @change="saveConfig" v-model="configuration.many" type="number" filled/>

                        <q-item-label header>Qual o intervalo, em minutos, entre cada tick?</q-item-label>
                        <q-input @change="saveConfig" v-model="configuration.when" type="number" filled/>

                        <q-item-label header>Resumo</q-item-label>
                        <p v-for="(p, i) in configSummary" :key="`p-${i}`" v-html="p" />

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
            loadingStocks: {},
            configuration: {
                which: 'all',
                many: 5,
                when: 15,
                variation: 'percentage'
            },
            tableLoading: false,
            showCreateForm: false,
            configDialog: false,
            pagination: {
                rowsPerPage: 50
            },
            visibleColumns: [ 'code', 'quantityBought', 'quantitySold', 'quantityBalance', 'valueBought', 'valueSold', 'lastUpdated', 'price', 'totalValue', 'source' ],
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
                    label: 'Atualizado em',
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
            updatePricesInterval: null,
            shouldUpdateInterval: false,
            updateSlice: [],
            withBalanceOnly: true,
            firstLoad: false
        };
    },
    methods: {
        downloadFromHistory() {
            this.$q.dialog({
                title: 'Confirmação',
                message: 'Essa ação irá limpar sua carteira com origem "CEI" e irá gerar uma nova carteira a partir do seu histórico de negociações. Tem certeza que deseja continuar?',
                cancel: true,
                persistent: true
            }).onOk(() => {
                ipcRenderer.send('wallet/refresh-from-history');
            });
        },
        saveConfig() {
            localStorage.setItem('wallet/config', JSON.stringify(this.configuration));
            this.refreshAutoUpdate(true);
        },
        init() {
            ipcRenderer.send('wallet/get');
            const config = localStorage.getItem('wallet/config');
            if (config)
                this.configuration = JSON.parse(config);
        },
        refreshAutoUpdate(force = false) {
            if (!(force || this.shouldUpdateInterval)) return;

            if (this.updatePricesInterval !== null)
                clearInterval(this.updatePricesInterval);

            if (this.configuration.which === 'none') return;

            if (Object.keys(this.loadingStocks).length === 0) {
                const intervalFunction = () => {
                    this.loadingStocks = {};

                    const stocksToUpdate = this.configuration.which === 'all'
                        ? this.dataTable
                        : this.dataTable.filter(o => o.quantityBalance > 0);

                    const totalToUpdate = stocksToUpdate.length;

                    if (this.updateSlice.length === 0 || this.updateSlice[1] === totalToUpdate) {
                        this.updateSlice = [0, this.configuration.many];
                    } else {
                        this.updateSlice[0] = this.updateSlice[1];
                        this.updateSlice[1] = Math.min(this.updateSlice[1] + this.configuration.many, totalToUpdate);
                    }

                    const stocks = stocksToUpdate.slice(this.updateSlice[0], this.updateSlice[1]).map(o => o.code);

                    for (const s of stocks) {
                        this.loadingStocks[s] = 1;
                    }

                    ipcRenderer.send('wallet/update-last-value', { stocks: stocks });
                };

                intervalFunction();
                this.updatePricesInterval = setInterval(intervalFunction, this.configuration.when * 1000 * 60);
                this.shouldUpdateInterval = false;
            } else {
                this.shouldUpdateInterval = true;
            }
        }
    },
    computed: {
        dataTable() {
            return this.data
                .map(d => {
                    return {
                        code: d.code,
                        quantityBought: d.quantityBought,
                        quantitySold: d.quantitySold,
                        quantityBalance: Math.max(d.quantityBought - d.quantitySold, 0),
                        valueBought: d.valueBought,
                        valueSold: d.valueSold,
                        price: d.price,
                        changePrice: d.changePrice,
                        changePercent: d.changePercent,
                        lastTradingDay: d.lastTradingDay,
                        lastUpdated: d.lastUpdated,
                        totalValue: 0,
                        source: d.source
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
            msgs.push(`A cada <strong>${NumberUtils.getFormatedHoursFromMinutes(this.configuration.when)}</strong>, <strong>${this.configuration.many}</strong> ações serão atualizadas.`);
            msgs.push(`Isso significa que uma mesma ação será atualizada a cada <strong>${NumberUtils.getFormatedHoursFromMinutes(interval)}</strong>.`);
            msgs.push(`Serão <strong>${updatesPerHour}</strong> atualizações por hora, totalizando <strong>${updatesPerHour * 24}</strong> atualizações por dia.`);

            return msgs;
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

            if (!this.firstLoad)
                this.refreshAutoUpdate(true);

            this.firstLoad = true;
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

        ipcRenderer.on('wallet/update-last-value', (event, response) => {
            this.loadingStocks = {};
            console.log(response.data);
            for (const r of response.data) {
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
            this.refreshAutoUpdate();
        });

        this.init();
    },
    beforeDestroy() {
        clearInterval(this.updatePricesInterval);
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

                        &.price-up {
                            color: #21BA45;
                        }

                        &.price-down {
                            color: #C10015;
                        }

                        .variation {
                            font-size: 10px;
                        }
                    }

                    tr:nth-child(odd) {
                        background: #f7f7f7;
                    }
                }
            }

        }
    }

</style>
