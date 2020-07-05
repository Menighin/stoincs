<template>
    <q-page class="flex flex-center column configurations-page">
        <div class="row">
            <div class="col-lg-6 col-md-12 col-sm-12 q-pa-md">
                <div class="row q-ma-sm justify-between items-center">
                    <h5 class="q-ma-none">CEI</h5>
                    <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                        <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
                            Usuário e senha do CEI utilizados para processar suas informações.
                        </q-menu>
                    </q-icon>
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
                            Para conseguir a sua chave, basta acessar o site da <a href="https://www.alphavantage.co/support/#api-key">Alpha Vantage</a> e criar seu usuário.
                        </q-menu>
                    </q-icon>
                </div>
                <q-input class="q-ma-sm" filled v-model="alphaVantageKey" label="Chave Alpha Vantage" />
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
                                    Caso esteja usando uma chave grátis da API, tenha cuidado para não ficar sem requisições. <br />
                                    O quadro de resumo te auxilia a encontrar os melhores parametros para utilizar a atualização automatica dos valores.
                                </q-menu>
                            </q-icon>
                        </div>

                        <q-item-label header class="q-my-none q-py-none">Atualizar automaticamente? <q-checkbox v-model="autoUpdate" /></q-item-label>

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

                        <q-item-label header>Quantas ações devem ser atualizadas por tick?</q-item-label>
                        <q-input dense v-model="priceUpdate.many" @blur="priceUpdate.many = Math.max(1, priceUpdate.many)" type="number" filled/>

                        <q-item-label header>Qual o intervalo, em minutos, entre cada tick?</q-item-label>
                        <q-input dense v-model="priceUpdate.when" @blur="priceUpdate.when = Math.max(1, priceUpdate.when)" type="number" filled/>

                        <q-item-label header>Entre quais horas do dia os preços devem ser atualizados?</q-item-label>
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
        <div class="row q-px-sm justify-end" style="width: 85%;">
            <q-btn color="primary" @click="save">Salvar</q-btn>
        </div>
    </q-page>
</template>

<script>

import DateUtils from '../../src-electron/utils/DateUtils';
import { ipcRenderer } from 'electron';

export default {
    name: 'PageConfigurations',
    data() {
        return {
            username: '',
            password: '',
            alphaVantageKey: '',
            isPwd: true,
            priceUpdate: {},
            stockToAdd: '',
            stocks: [],
            walletStocks: [],
            historyStocks: [],
            Math: Math,
            wallet: [],
            autoUpdate: false
        };
    },
    methods: {
        save() {
            const configuration = {
                username: this.username,
                password: this.password,
                alphaVantageKey: this.alphaVantageKey,
                priceUpdate: {
                    ...this.priceUpdate,
                    auto: this.autoUpdate
                }
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
                this.username = response.data.username || '';
                this.password = response.data.password || '';
                this.alphaVantageKey = response.data.alphaVantageKey || '';
                this.priceUpdate = response.data.priceUpdate;

                if (!this.priceUpdate.auto) this.priceUpdate.auto = true;
                if (!this.priceUpdate.many) this.priceUpdate.many = 1;
                if (!this.priceUpdate.when) this.priceUpdate.when = 1;
                if (!this.priceUpdate.startTime) this.priceUpdate.startTime = '00:00';
                if (!this.priceUpdate.endTime) this.priceUpdate.endTime = '00:00';

                this.autoUpdate = this.priceUpdate.auto;
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
}

</style>
