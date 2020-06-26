<template>
    <q-page class="prices-page">
        <div class="filter">
            <q-btn outline color="primary" label="Sincronizar com Histórico" class="q-mx-sm q-my-lg" icon="eva-sync-outline" @click="downloadFromHistory"/>
            <q-btn outline color="primary" class="q-mx-sm q-my-lg" icon="eva-settings-2-outline" @click="configDialog = true"/>
        </div>

        <div class="stock-cards q-pa-md row items-start q-gutter-lg">
            <q-card v-for="sp in pricesCard" :key="`price-${sp.code}`" class="stock-card">
                <q-card-section class="stock-title q-py-sm">
                    <div class="row">
                        <div class="col code">
                            {{ sp.code }}
                        </div>
                        <div class="col quantity">
                            {{ sp.quantity }}
                        </div>
                    </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="stock-info q-px-lg q-py-sm">
                    <div class="row" :class="{'variation-up': sp.variation === 'up', 'variation-down': sp.variation === 'down'}" style="width: 260px;">
                        <div class="col-10">
                            <div class="column" style="height: 100%">
                                <div class="col price flex flex-center q-mx-lg q-py-sm">
                                    {{ sp.price }}
                                </div>
                                <div class="col variation flex flex-center">
                                    <span>{{ sp.changePercent }}</span>
                                    <span>{{ sp.changePrice }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="col-2 flex flex-center icon">
                            <q-icon name="eva-trending-up-outline" class="variation-up" style="font-size: 36px" v-if="sp.variation === 'up'" />
                            <q-icon name="eva-trending-down-outline" class="variation-down" style="font-size: 36px" v-else-if="sp.variation === 'down'" />
                            <q-icon name="eva-minus-outline" style="font-size: 36px" v-else />
                        </div>
                    </div>
                    <div class="last-updated" align="center">
                        {{ sp.lastUpdated }}
                    </div>
                </q-card-section>

                <q-separator />

                <q-card-actions align="right">
                    <q-btn round flat color="primary" size="12px" icon="eva-bell-outline" />
                    <q-btn round flat color="primary" size="12px" icon="eva-sync-outline" @click="syncStock(sp.code)" />
                    <q-btn round flat color="primary" size="12px" icon="eva-trash-2-outline" />
                </q-card-actions>

                <q-inner-loading :showing="loadingStocks[sp.code] === 1">
                    <q-spinner-tail size="50px" color="primary" />
                </q-inner-loading>
            </q-card>
        </div>

        <q-dialog>
            <q-card style="min-width: 550px">
                <q-card-section class="row q-ma-sm justify-between items-center">
                    <div class="text-h6">Editar label para</div>
                </q-card-section>
                <q-separator />
                <q-card-section style="max-height: 80vh" class="scroll">

                    <q-item-label header>Label do ativo</q-item-label>

                </q-card-section>
                <q-separator />
                <q-card-actions align="right">
                    <q-btn flat label="Cancelar" color="primary" v-close-popup />
                    <q-btn flat label="Salvar" color="primary" />
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
            loadingStocks: {},
            wallet: {},
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
        },
        syncStock(code) {
            this.$set(this.loadingStocks, code, 1);
            ipcRenderer.send('stock-prices/update', { stocks: [code] });
        }
    },
    computed: {
        pricesCard() {
            return Object.keys(this.stockPrices).sort().map(k => {
                const stockPrice = this.stockPrices[k];
                const quantity = this.wallet[k] ? this.wallet[k].quantity : '-';
                return {
                    code: k,
                    price: NumberUtils.formatCurrency(stockPrice.price),
                    changePercent: NumberUtils.formatPercentage(stockPrice.changePercent, true) || '-',
                    changePrice: NumberUtils.formatCurrency(stockPrice.changePrice, true) || '-',
                    lastUpdated: DateUtils.getDiffDateFormated(new Date(stockPrice.lastUpdated), new Date()),
                    quantity: quantity,
                    variation: stockPrice.changePrice > 0 ? 'up' : stockPrice.changePrice < 0 ? 'down' : 'unchanged'
                };
            });
        }
    },
    mounted() {
        ipcRenderer.on('wallet/get', (event, response) => {
            if (response.status === 'success') {
                this.wallet = response.data.reduce((p, c) => { p[c.code] = c; return p }, {});
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

    .prices-page {
        .filter {
            text-align: right;
        }

        .stock-cards {
            .stock-card {
                .stock-title {
                    .code {
                        font-size: 24px;
                        vertical-align: middle;
                    }

                    .quantity {
                        vertical-align: middle;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: flex-end;
                    }
                }

                .stock-info {
                    .price {
                        font-size: 36px;
                        border-bottom: 4px dotted #eee;
                    }
                    .variation {
                        font-size: 18px;
                        span:first-child {
                            margin-right: 20px;
                        }
                    }
                    .last-updated {
                        color: #aaa;
                        font-size: 11px;
                        padding: 8px 0 5px;
                    }
                }
            }

            .variation-up {
                color: #5fbf47
            }

            .variation-down {
                color: #f55
            }
        }
    }

</style>
