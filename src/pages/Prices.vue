<template>
    <q-page class="prices-page filter">
        <div class="page-actions">
            <q-btn round color="primary" class="q-mx-sm q-my-lg" icon="sort">
                <q-menu content-class="sort-menu">
                    <q-list style="min-width: 100px">
                        <q-item v-for="item in sortMenu" :class="{'active': item.value === selectedSort}" :key="item.value" clickable v-close-popup @click="sort(item.value)">
                            <q-item-section>{{ item.label }}</q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </q-btn>
            <q-btn round color="primary" class="q-mx-sm q-my-lg" icon="eva-plus-outline" @click="addStock"/>
        </div>

        <div class="no-data no-data" v-if="pricesCard.length === 0">
            <h5> Não há ativos cadastrados para acompanhamento de preços <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
            <span>
                Adicione ativos no botão "+" acima e configure sua chave da Alpha Vantage para acompanhar os preços de um ativo
            </span>
        </div>

        <transition-group class="stock-cards q-pa-md row items-start q-gutter-lg" name="list-complete">
            <q-card v-for="sp in pricesCard" :key="`price-${sp.code}`" class="stock-card" :class="{'new': sp.isNew}">
                <q-card-section class="stock-title q-py-sm">
                    <div class="row">
                        <div class="col new-stock-code" :class="{ 'invalid': newStockError }" v-if="sp.isNew">
                            <q-input
                                borderless
                                mask="AAAA##"
                                type="text"
                                ref="newStockInput"
                                v-model="newStock"
                                placeholder="Código"
                                @input="newStockTooltip = false; newStockError = false;"
                                @keydown.enter="saveNewStock"
                                @keydown.esc="cancelNewStock"
                                @blur="cancelNewStock">
                                <q-tooltip :delay="1000" content-class="bg-primary tooltip" anchor="bottom left" self="top left" v-model="newStockTooltip" :target="newStockTooltip">
                                    Pressione <strong>Enter</strong> para salvar, <strong>ESC</strong> para cancelar
                                </q-tooltip>
                                <q-tooltip content-class="tooltip bg-red" anchor="bottom left" self="top left" v-model="newStockError" :target="newStockError">
                                    {{ errorMsg }}
                                </q-tooltip>
                            </q-input>
                        </div>
                        <div class="col code" v-else>
                            {{ sp.code }}
                        </div>
                        <div class="col quantity">
                            {{ sp.quantity || '-' }}
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
                    <q-btn round flat color="primary" size="12px" icon="eva-bell-outline" @click="setupAlarm(sp.code)" />
                    <q-btn round flat color="primary" size="12px" icon="eva-sync-outline" @click="syncStock(sp.code)" />
                    <q-btn round flat color="primary" size="12px" icon="eva-trash-2-outline" @click="deleteStock(sp.code)" />
                </q-card-actions>

                <q-inner-loading :showing="loadingStocks[sp.code] === 1">
                    <q-spinner-tail size="50px" color="primary" />
                </q-inner-loading>
            </q-card>
        </transition-group>
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
            DateUtils: DateUtils,
            newStock: null,
            newStockTooltip: false,
            newStockError: false,
            errorMsg: '',
            selectedSort: 'code',
            sortMenu: [
                { value: 'code', label: 'Código' },
                { value: 'walletQuantity', label: 'Quantidade em carteira' },
                { value: 'price', label: 'Preço' },
                { value: 'variation', label: 'Variação' }
            ]
        };
    },
    methods: {
        deleteStock(code) {
            this.$q.dialog({
                title: 'Confirmação',
                message: `Tem certeza que deseja remover <strong>${code}</strong>?`,
                cancel: true,
                html: true,
                persistent: true
            }).onOk(() => {
                ipcRenderer.send('stock-prices/delete-stock', { code: code });
                this.$delete(this.stockPrices, code);
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
            ipcRenderer.send('stock-prices/auto-update', { stocks: [code] });
        },
        sort(code) {
            localStorage.setItem('prices-page-sort', code);
            this.selectedSort = code;
        },
        async addStock() {
            this.$set(this.stockPrices, 'new-stock', {
                price: 0,
                changePercent: 0,
                changePrice: 0,
                lastUpdated: new Date(),
                isNew: true
            });
            await this.$nextTick();
            this.$refs.newStockInput[0].focus();
            setTimeout(() => {
                this.newStockTooltip = true;
            }, 500);
        },
        saveNewStock() {
            if (this.newStock === null || this.newStock.length < 5) {
                this.newStockError = true;
                this.errorMsg = 'Esse não é um código válido';
                return;
            }

            if (Object.keys(this.stockPrices).indexOf(this.newStock) !== -1) {
                this.newStockError = true;
                this.errorMsg = `${this.newStock} já está cadastrado`;
                return;
            }

            ipcRenderer.send('stock-prices/add-stock', { code: this.newStock });
            this.newStockError = false;
            this.$delete(this.stockPrices, 'new-stock');
        },
        cancelNewStock() {
            this.newStock = null;
            this.$delete(this.stockPrices, 'new-stock');
            this.newStockError = false;
            this.newStockTooltip = false;
        },
        setupAlarm(code) {
            this.$q.notify({ type: 'positive', message: `Feature nao implementada ainda n_n'` });
        }
    },
    computed: {
        pricesCard() {
            const result = Object.keys(this.stockPrices).map(k => {
                const stockPrice = this.stockPrices[k];
                const quantity = this.wallet[k] ? this.wallet[k].quantity : 0;
                return {
                    code: k,
                    price: NumberUtils.formatCurrency(stockPrice.price) || '-',
                    priceRaw: stockPrice.price,
                    changePercent: NumberUtils.formatPercentage(stockPrice.changePercent, true) || '-',
                    changePercentRaw: stockPrice.changePercent,
                    changePrice: NumberUtils.formatCurrency(stockPrice.changePrice, true) || '-',
                    lastUpdated: DateUtils.getDiffDateFormated(new Date(stockPrice.lastUpdated), new Date()),
                    quantity: quantity,
                    variation: stockPrice.changePrice > 0 ? 'up' : stockPrice.changePrice < 0 ? 'down' : 'unchanged',
                    isNew: stockPrice.isNew || false
                };
            });

            result.sort((a, b) => {
                if (a.code === 'new-stock') return -1;
                if (b.code === 'new-stock') return 1;

                if (this.selectedSort === 'code')
                    return a.code < b.code ? -1 : a.code > b.code ? 1 : 0;
                else if (this.selectedSort === 'price')
                    return b.priceRaw - a.priceRaw;
                else if (this.selectedSort === 'walletQuantity')
                    return b.quantity - a.quantity;
                else if (this.selectedSort === 'variation')
                    return Math.abs(b.changePercentRaw) - Math.abs(a.changePercentRaw);

                return 1;
            });

            return result;
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

        ipcRenderer.on('stock-prices/auto-update', (event, response) => {
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

        ipcRenderer.on('stock-prices/delete-stock', (event, response) => {
            if (response.status === 'success') {
                this.$q.notify({ type: 'positive', message: `${response.code} removida com sucesso` });
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao remover ação: ${response.message}` });
                console.error(response);
            }
        });

        ipcRenderer.on('stock-prices/add-stock', (event, response) => {
            if (response.status === 'success') {
                this.$q.notify({ type: 'positive', message: `Ação adicionada com sucesso` });
                const code = Object.keys(response.data)[0];
                const value = Object.values(response.data)[0];
                this.$set(this.stockPrices, code, value);
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao remover ação: ${response.message}` });
                console.error(response);
            }
        });

        this.selectedSort = localStorage.getItem('prices-page-sort') || 'code';

        this.init();
    }
};
</script>

<style lang="scss">

    .sort-menu {
        .active {
            color: $primary;
        }
    }

    .prices-page {

        .page-actions {
            text-align: right;
        }

        .list-complete-item {
            transition: all 1s;
        }

        .list-complete-enter, .list-complete-leave-to {
            opacity: 0;
            transform: translateX(-30px);
        }

        .list-complete-leave-active {
            position: absolute;
        }

        .no-data {
            border: 1px solid #ddd;
            background: #fdfdfd;
            text-align: center;
            margin: 0 60px;
            padding: 60px 0 60px;
        }

        .stock-cards {
            display: flex;
            justify-content: center;
            .stock-card {
                transition: all 300ms;

                &.new {
                    color: #aaa;
                }

                .stock-title {
                    .code {
                        font-size: 24px;
                        vertical-align: middle;
                    }

                    .new-stock-code {
                        &.invalid {
                            input {
                                color: red !important;
                            }
                        }

                        .q-field__control {
                            height: auto
                        }

                        input {
                            border: 0;
                            font-size: 24px;
                            padding: 5px 0;
                        }
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
