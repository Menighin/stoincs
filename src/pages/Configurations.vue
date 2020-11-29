<template>
    <q-page class="flex flex-center column configurations-page">
        <div class="row">
            <div class="col-lg-6 col-md-12 col-sm-12 q-pa-md">
                <div class="row q-ma-sm justify-between items-center">
                    <h5 class="q-ma-none">CEI</h5>
                    <div>
                        <q-btn color="primary" round flat icon="eva-settings-2-outline" @click="configCeiDialog = true"/>
                        <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                            <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
                                Usuário e senha do CEI utilizados para processar suas informações.
                            </q-menu>
                        </q-icon>
                    </div>
                </div>
                <q-input class="q-mx-sm" filled v-model="username" label="CPF" mask="###.###.###-##" />
                <q-input class="q-ma-sm" filled v-model="password" label="Senha" :type="isPwd ? 'password' : 'text'">
                    <template v-slot:append>
                        <q-icon
                            :name="isPwd ? 'visibility_off' : 'visibility'"
                            class="cursor-pointer"
                            @click="isPwd = !isPwd"
                        />
                    </template>
                </q-input>
                <div class="row q-ma-sm justify-between items-center">
                    <h5 class="q-ma-none">Alpha Vantage</h5>
                    <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                        <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
                            Chave de acesso da API Alpha Vantage.<br />Essa API é utilizada para buscar os valores das ações em tempo real.<br />
                            Para conseguir a sua chave, basta acessar o site da <a href="#" @click="$event.preventDefault(); shell.openExternal('https://www.alphavantage.co/support/#api-key')">Alpha Vantage</a> e criar seu usuário.
                        </q-menu>
                    </q-icon>
                </div>
                <q-input class="q-ma-sm" filled v-model="alphaVantageKey" label="Chave Alpha Vantage" />
                <div class="row q-ma-sm justify-between items-center">
                    <h5 class="q-ma-none">HG Brasil</h5>
                    <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                        <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
                            Chave de acesso da API HG Brasil.<br />Essa API é utilizada para buscar os valores das ações em tempo real.<br />
                            Para conseguir a sua chave, basta acessar o site da <a href="#" @click="$event.preventDefault(); shell.openExternal('https://hgbrasil.com/')">HG Brasil</a>, criar seu usuário e criar sua chave de acesso.
                        </q-menu>
                    </q-icon>
                </div>
                <q-input class="q-ma-sm" filled v-model="hgBrasilKey" label="Chave HG Brasil" />
            </div>

            <div class="col-lg-6 col-md-12 col-sm-12 q-pa-md">
                <q-card class="q-pb-lg" style="min-width: 550px">
                    <q-card-section>
                        <div class="row q-ma-sm justify-between items-center">
                            <h5 class="q-ma-none">Atualização de preços</h5>
                            <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                                <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
                                    Define a frequência de atualização de preços dos ativos.<br />
                                    A API grátis da Alpha Vantage é limitada a 5 requisições por minuto e 500 requisições diárias.<br />
                                    A API grátis da HG Brasil é limitada a 400 requisições diárias.<br />
                                    Caso esteja usando uma chave grátis de uma dessas APIs, tenha cuidado para não ficar sem requisições. <br />
                                    O quadro de resumo te auxilia a encontrar os melhores parametros para utilizar a atualização automatica dos valores.
                                </q-menu>
                            </q-icon>
                        </div>

                        <q-item-label header class="q-my-none q-py-none">Atualizar automaticamente? <q-checkbox v-model="autoUpdate" /></q-item-label>

                        <div>
                            <q-item-label header class="q-my-none q-py-none">Qual método de atualização?</q-item-label>
                            <q-radio label="Web Crawler" val="crawler" v-model="updatePriceApi" />
                            <q-radio label="Alpha Vantage" val="alpha-vantage" v-model="updatePriceApi" />
                            <q-radio label="HG Brasil" val="hg-brasil" v-model="updatePriceApi" />
                        </div>

                        <q-item-label header>Quais ações devem ter o valor atualizado?</q-item-label>
                        <div class="q-gutter-md row items-start">
                            <q-input dense placeholder="Código" v-model="stockToAdd" @keydown.enter="addStock" filled mask="AAAA##" />
                            <q-btn flat round color="primary" class="q-mx-sm q-my-md" icon="eva-plus-circle-outline" @click="addStock"/>
                            <q-btn flat round color="primary" class="q-mx-sm q-my-md" icon="eva-trash-2-outline" @click="clearStocks"/>
                            <q-btn flat round color="primary" class="q-mx-sm q-my-md" icon="eva-more-vertical-outline">
                                <q-menu>
                                    <q-list style="min-width: 100px">
                                        <q-item clickable v-close-popup @click="addWalletStocks">
                                            <q-item-section>Adicionar ações da carteira</q-item-section>
                                        </q-item>
                                        <q-item clickable v-close-popup @click="addHistoryStocks">
                                            <q-item-section>Adicionar ações no histórico</q-item-section>
                                        </q-item>
                                    </q-list>
                                </q-menu>
                            </q-btn>
                        </div>

                        <span style="font-size: 11px; color: #777; padding: 0">{{ stocks.length }} ações</span>
                        <div class="stocks-container">
                            <template v-for="(s, i) in this.filteredStocks">
                                <q-chip :key="`${s}-${i}`" removable @remove="removeStock(s)" color="primary" text-color="white">
                                    {{ s }}
                                </q-chip>
                            </template>
                        </div>

                        <q-item-label header class="q-mt-sm">Atualizar <q-input class="inline-input" dense v-model="priceUpdate.many" @blur="priceUpdate.many = Math.max(1, priceUpdate.many)" type="number" filled/> ações
                            a cada <q-input class="inline-input" dense v-model="priceUpdate.when" @blur="priceUpdate.when = Math.max(1, priceUpdate.when)" type="number" filled/> minuto(s)</q-item-label>

                        <q-item-label header style="margin-top: 0">Entre quais horas do dia os preços devem ser atualizados?</q-item-label>
                        <div class="row">
                            <q-input dense class="q-pr-sm q-pb-none" filled v-model="priceUpdate.startTime" mask="time" :rules="['time']" label="Início">
                                <template v-slot:append>
                                    <q-icon name="access_time" class="cursor-pointer">
                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                            <q-time format24h v-model="priceUpdate.startTime" />
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                            <q-input dense class="q-pl-sm q-pb-none" filled v-model="priceUpdate.endTime" mask="time" :rules="['time']" label="Fim">
                                <template v-slot:append>
                                    <q-icon name="access_time" class="cursor-pointer">
                                        <q-popup-proxy transition-show="scale" transition-hide="scale">
                                            <q-time format24h v-model="priceUpdate.endTime" />
                                        </q-popup-proxy>
                                    </q-icon>
                                </template>
                            </q-input>
                        </div>

                        <q-item-label header>Resumo</q-item-label>
                        <p v-for="(p, i) in configSummary" :key="`p-${i}`" v-html="p" />

                    </q-card-section>
                </q-card>
            </div>
        </div>

        <q-dialog v-model="configCeiDialog">
            <q-card class="q-pb-lg" style="min-width: 550px">
                <q-card-section class="row q-ma-none justify-between items-center">
                    <div class="text-h5">Sincronização com CEI</div>
                </q-card-section>

                <q-separator />

                <q-card-section style="max-height: 80vh" class="scroll">
                    <q-card-section class="column">
                        <q-toggle v-model="ceiConfig.stockHistory" label="Negociações" />
                        <div class="q-px-sm q-pb-lg toggle-info">
                            Se ativo, as negociações do CEI serão integradas automaticamente. As negociações são utilizadas para diversos relatórios e telas no Stoincs.
                        </div>

                        <q-toggle v-model="ceiConfig.dividends" label="Dividendos" />
                        <div class="q-px-sm q-pb-lg toggle-info">
                            Se ativo, os dividendos recebidos serão integrados automaticamente com o CEI. Essas informações são exibidas na tela de dividendos e em relatórios de posições.
                        </div>

                        <q-toggle v-model="ceiConfig.treasuryDirect" label="Tesouro Direto" />
                        <div class="q-px-sm q-pb-lg toggle-info">
                            Se ativo, seus investimentos em tesouro direto serão integrados automaticamente com o CEI. Essas informações são exibidas nas telas e relatórios de Tesouro Direto.
                        </div>

                        <q-toggle v-model="ceiConfig.walletHistory" label="Histórico da Carteira" />
                        <div class="q-px-sm toggle-info">
                            Se ativo, será integrado com o CEI automaticamente suas posições no final de cada dia para que seja montado o gráfico de Performance da Carteira.
                        </div>
                    </q-card-section>
                </q-card-section>

            </q-card>
        </q-dialog>

        <div class="row q-px-sm justify-end" style="width: 85%;">
            <q-btn color="primary" @click="save">Salvar</q-btn>
        </div>
    </q-page>
</template>

<script>

import DateUtils from '../../src-shared/utils/DateUtils';
import { ipcRenderer, shell } from 'electron';
import axios from 'axios';

export default {
    name: 'PageConfigurations',
    data() {
        return {
            username: '',
            password: '',
            alphaVantageKey: '',
            updatePriceApi: '',
            hgBrasilKey: '',
            isPwd: true,
            priceUpdate: {},
            stockToAdd: '',
            stocks: [],
            walletStocks: [],
            historyStocks: [],
            Math: Math,
            wallet: [],
            autoUpdate: false,
            shell: shell,
            configCeiDialog: false,
            ceiConfig: {}
        };
    },
    methods: {
        save() {
            const configuration = {
                username: this.username,
                password: this.password,
                alphaVantageKey: this.alphaVantageKey,
                hgBrasilKey: this.hgBrasilKey,
                priceUpdate: {
                    ...this.priceUpdate,
                    auto: this.autoUpdate,
                    updatePriceApi: this.updatePriceApi
                },
                ceiConfig: this.ceiConfig
            };

            ipcRenderer.send('configuration/update', configuration);
            ipcRenderer.send('stock-prices/save-stocks-configuration', this.stocks);
        },
        addStock() {
            if (!this.stocks)
                this.stocks = [];

            if (this.stocks.indexOf(this.stockToAdd) === -1)
                this.stocks.push(this.stockToAdd);

            this.stocks.sort();
            this.stockToAdd = '';
        },
        removeStock(s) {
            const index = this.stocks.indexOf(s);
            this.stocks.splice(index, 1);
        },
        addWalletStocks() {
            this.walletStocks.forEach(s => {
                if (this.stocks.indexOf(s) === -1)
                    this.stocks.push(s);
            });
            this.stocks.sort();
        },
        addHistoryStocks() {
            this.historyStocks.forEach(s => {
                if (this.stocks.indexOf(s) === -1)
                    this.stocks.push(s);
            });
            this.stocks.sort();
        },
        clearStocks() {
            this.stocks = [];
        }
    },
    computed: {
        configSummary() {
            if (this.stocks.length === 0 || this.priceUpdate.many < 1 || this.priceUpdate.when < 1) {
                return ['Nenhum valor de ação será atualizado automaticamente'];
            }

            let many = this.stocks.length;

            const hoursBetween = Math.ceil(DateUtils.minutesBetweenTimes(this.priceUpdate.startTime, this.priceUpdate.endTime) / 60);

            const interval = (Math.max(1, many / this.priceUpdate.many) * this.priceUpdate.when).toFixed(2);
            const ticksPerHour = 60 / this.priceUpdate.when;
            const updatesPerHour = parseInt(Math.ceil(ticksPerHour * Math.min(this.priceUpdate.many, many)));

            const msgs = [`<strong>${many}</strong> ações serão atualizadas entre ${this.priceUpdate.startTime}h e ${this.priceUpdate.endTime}h.`];
            msgs.push(`A cada <strong>${DateUtils.getFormatedHoursFromSeconds(this.priceUpdate.when * 60, true, true, false)}</strong>, <strong>${this.priceUpdate.many}</strong> ações serão atualizadas.`);
            msgs.push(`Isso significa que uma mesma ação será atualizada a cada <strong>${DateUtils.getFormatedHoursFromSeconds(interval * 60, true, true, false)}</strong>.`);
            msgs.push(`Serão <strong>${updatesPerHour}</strong> atualizações por hora, totalizando <strong>${updatesPerHour * hoursBetween}</strong> atualizações por dia, dado os horários de atualizacao.`);

            return msgs;
        },
        filteredStocks() {
            if (this.stockToAdd === null || this.stockToAdd === undefined || this.stockToAdd.length === 0) return this.stocks;
            return this.stocks.filter(s => s.startsWith(this.stockToAdd));
        }
    },
    mounted() {
        ipcRenderer.on('configuration/get-stock-options', (event, response) => {
            if (response.status === 'success') {
                this.walletStocks = response.data.wallet;
                this.historyStocks = response.data.stockHistory;
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao ler sua carteira: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('configuration/update', (event, response) => {
            if (response.status === 'success') {
                this.$q.notify({ type: 'positive', message: 'Configurações salvas com sucesso!' });
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao salvar configurações: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('configuration/get', (event, response) => {
            if (response.status === 'success') {
                this.username = response.data.username;
                this.password = response.data.password;
                this.alphaVantageKey = response.data.alphaVantageKey;
                this.hgBrasilKey = response.data.hgBrasilKey;
                this.priceUpdate = response.data.priceUpdate;
                this.ceiConfig = response.data.ceiConfig;
                this.autoUpdate = this.priceUpdate.auto;
                this.updatePriceApi = this.priceUpdate.updatePriceApi;
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao ler suas configurações: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.on('stock-prices/get', (event, response) => {
            if (response.status === 'success') {
                this.stocks = Object.keys(response.data);
            } else {
                this.$q.notify({ type: 'negative', message: `Error ao ler preço de ações: ${response.error.message}` });
                console.error(response.error);
            }
        });

        ipcRenderer.send('configuration/get-stock-options');
        ipcRenderer.send('configuration/get');
        ipcRenderer.send('stock-prices/get');
    }
};
</script>

<style lang="scss">

.configurations-page {
    .stocks-container {
        overflow: auto;
        max-width: 520px;
        max-height: 77px;
        padding: 2px 5px;
        border: 1px solid #ccc;
        min-height: 77px;
    }

    .inline-input {
        display: inline-block;
        width: 50px;
    }
}

.toggle-info {
    color: #aaa;
    font-size: 12px;
}

</style>
