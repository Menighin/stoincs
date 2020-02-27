<template>
    <q-page class="flex flex-center">
        <div class="column q-pa-md" style="width: 80%">
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

            <div class="row q-px-sm justify-end">
                <q-btn color="primary" @click="save">Salvar</q-btn>
            </div>
        </div>
    </q-page>
</template>

<script>

const STORAGE_KEY = {
    USERNAME: 'configuration/username',
    PASSWORD: 'configuration/password',
    ALPHA_VANTAGE: 'configuration/alpha-vantage-key'
};

export default {
    name: 'PageConfigurations',
    data() {
        return {
            username: '',
            password: '',
            alphaVantageKey: '',
            isPwd: true
        };
    },
    methods: {
        save() {
            localStorage.setItem(STORAGE_KEY.USERNAME, this.username);
            localStorage.setItem(STORAGE_KEY.PASSWORD, this.password);
            localStorage.setItem(STORAGE_KEY.ALPHA_VANTAGE, this.alphaVantageKey);
            this.$q.notify({ type: 'positive', message: 'Configurações salvas com sucesso!' });
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
    }
};
</script>
