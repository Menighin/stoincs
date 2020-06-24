<template>
    <q-page class="">
        <div class="filter">
            <q-btn outline color="primary" label="Sincronizar com Histórico" class="q-mx-sm q-my-lg" icon="eva-sync-outline" @click="downloadFromHistory"/>
            <q-btn outline color="primary" class="q-mx-sm q-my-lg" icon="eva-settings-2-outline" @click="configDialog = true"/>
        </div>

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
            wallet: [],
            stockPrices: {},
            NumberUtils: NumberUtils,
            DateUtils: DateUtils
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
            ipcRenderer.send('stock-prices/get');
            ipcRenderer.send('stockHistory/average-prices');
            ipcRenderer.send('stockHistory/consolidated');
            const config = localStorage.getItem('wallet/config');
            if (config)
                this.configuration = JSON.parse(config);
        },
        syncRow(row) {
            this.$set(this.loadingStocks, row.code, 1);
            ipcRenderer.send('stock-prices/update', { stocks: [row.code] });
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
            return this.wallet.map(w => {
                const consolidatedStock = this.consolidated[w.code];
                const price = this.stockPrices[w.code] ? this.stockPrices[w.code].price : 0;
                const historicPosition = consolidatedStock ? consolidatedStock.valueSold + w.quantity * price - consolidatedStock.valueBought : 0;
                const historicVariation = consolidatedStock && consolidatedStock.valueBought ? historicPosition / consolidatedStock.valueBought : 0;
                return {
                    ...w,
                    value: price * w.quantity,
                    price: price,
                    changePrice: this.stockPrices[w.code] ? this.stockPrices[w.code].changePrice : 0,
                    changePercent: this.stockPrices[w.code] ? this.stockPrices[w.code].changePrice / this.stockPrices[w.code].price * 100 : 0,
                    lastUpdated: this.stockPrices[w.code] ? this.stockPrices[w.code].lastUpdated : null,
                    averageBuyPrice: this.averagePrices[w.code] ? this.averagePrices[w.code].averageBuyPrice : 0,
                    historicPosition: historicPosition,
                    historicVariation: historicVariation * 100
                };
            });
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

        ipcRenderer.on('stockHistory/average-prices', (event, response) => {
            if (response.status === 'success') {
                this.averagePrices = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar preços médios de ativos` });
                console.error(response);
            }
        });

        ipcRenderer.on('stockHistory/consolidated', (event, response) => {
            if (response.status === 'success') {
                this.consolidated = response.data.reduce((p, c) => { p[c.code] = c; return p }, {});
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
            for (const stock of response.data)
                this.$set(this.loadingStocks, stock, 1);
        });

        ipcRenderer.on('stock-prices/update', (event, response) => {
            for (const s of response.data)
                this.$set(this.loadingStocks, s.code, 0);

            // Update successfull updates
            for (const r of response.data.filter(o => o.status === 'success')) {
                if (!this.stockPrices[r.code]) this.stockPrices[r.code] = {};
                this.stockPrices[r.code].price = r.price;
                this.stockPrices[r.code].changePrice = r.changePrice;
                this.stockPrices[r.code].changePercent = r.changePercent;
                this.stockPrices[r.code].lastTradingDay = r.lastTradingDay;
                this.stockPrices[r.code].lastUpdated = r.lastUpdated;
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
