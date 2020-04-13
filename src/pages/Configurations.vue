<template>
    <q-page class="flex flex-center column">
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

                        <q-item-label header>Quais ações devem ter o valor atualizado?</q-item-label>
                        <q-radio v-model="priceUpdate.which" val="all" label="Todas" />
                        <q-radio v-model="priceUpdate.which" val="balance" label="As que possuem saldo" />
                        <q-radio v-model="priceUpdate.which" val="none" label="Nenhuma" />

                        <q-item-label header>Quantas ações devem ser atualizadas por tick?</q-item-label>
                        <q-input v-model="priceUpdate.many" type="number" filled/>

                        <q-item-label header>Qual o intervalo, em minutos, entre cada tick?</q-item-label>
                        <q-input v-model="priceUpdate.when" type="number" filled/>

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

const STORAGE_KEY = {
    USERNAME: 'configuration/username',
    PASSWORD: 'configuration/password',
    ALPHA_VANTAGE: 'configuration/alpha-vantage-key',
    PRICE_UPDATE: 'configuration/price-update'
};

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
            wallet: []
        };
    },
    methods: {
        save() {
            localStorage.setItem(STORAGE_KEY.USERNAME, this.username);
            localStorage.setItem(STORAGE_KEY.PASSWORD, this.password);
            localStorage.setItem(STORAGE_KEY.ALPHA_VANTAGE, this.alphaVantageKey);
            localStorage.setItem(STORAGE_KEY.PRICE_UPDATE, JSON.stringify(this.priceUpdate));
            ipcRenderer.send('configuration/update');
        }
    },
    computed: {
        configSummary() {
            if (this.priceUpdate.which === 'none') {
                return ['Nenhum valor de ação será atualizado automaticamente'];
            }

            let many = this.wallet.length;
            if (this.priceUpdate.which === 'balance') {
                many = this.wallet.filter(d => d.quantityBought - d.quantitySold > 0).length;
            }

            const interval = (Math.max(1, many / this.priceUpdate.many) * this.priceUpdate.when).toFixed(2);
            const ticksPerHour = 60 / this.priceUpdate.when;
            const updatesPerHour = parseInt(Math.ceil(ticksPerHour * Math.min(this.priceUpdate.many, many)));

            const msgs = [`<strong>${many}</strong> ações serão atualizadas.`];
            msgs.push(`A cada <strong>${DateUtils.getFormatedHoursFromSeconds(this.priceUpdate.when * 60, true, true, false)}</strong>, <strong>${this.priceUpdate.many}</strong> ações serão atualizadas.`);
            msgs.push(`Isso significa que uma mesma ação será atualizada a cada <strong>${DateUtils.getFormatedHoursFromSeconds(interval * 60, true, true, false)}</strong>.`);
            msgs.push(`Serão <strong>${updatesPerHour}</strong> atualizações por hora, totalizando <strong>${updatesPerHour * 24}</strong> atualizações por dia.`);

            return msgs;
        }
    },
    mounted() {
        if (localStorage.getItem(STORAGE_KEY.USERNAME)) {
            this.username = localStorage.getItem(STORAGE_KEY.USERNAME);
        }

        if (localStorage.getItem(STORAGE_KEY.PASSWORD)) {
            this.password = localStorage.getItem(STORAGE_KEY.PASSWORD);
        }

        if (localStorage.getItem(STORAGE_KEY.ALPHA_VANTAGE)) {
            this.alphaVantageKey = localStorage.getItem(STORAGE_KEY.ALPHA_VANTAGE);
        }

        if (localStorage.getItem(STORAGE_KEY.PRICE_UPDATE)) {
            this.priceUpdate = JSON.parse(localStorage.getItem(STORAGE_KEY.PRICE_UPDATE));
        } else {
            this.priceUpdate = {
                which: 'none',
                many: 0,
                when: 0
            };
        }

        ipcRenderer.on('wallet/get', (event, response) => {
            if (response.status === 'success') {
                this.wallet = response.data;
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

        ipcRenderer.send('wallet/get');
    }
};
</script>
