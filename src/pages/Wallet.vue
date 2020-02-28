<template>
    <q-page class="">
        <div class="filter">
            <q-btn outline color="primary" label="Baixar do Histórico" class="q-mx-sm q-my-lg" icon="eva-cloud-download-outline" @click="downloadFromHistory"/>
            <q-btn outline color="primary" class="q-mx-sm q-my-lg" icon="eva-settings-2-outline" @click="configDialog = true"/>
        </div>

        <q-table
            class="table-container q-mx-lg"
            table-class="stock-table"
            title="Carteira de ações"
            :data="dataTable"
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

            <q-td auto-width slot="body-cell-action" slot-scope="props" :props="props">
                <q-btn flat icon="eva-trash-2-outline" @click="deleteRow(props.row)" color="primary" />
            </q-td>
        </q-table>

        <q-dialog v-model="configDialog">
            <q-card class="q-pb-lg q-pl-md q-pr-md">
                <q-card-section class="row q-ma-sm justify-between items-center">
                    <div class="text-h6">Configurações</div>
                    <q-icon name="help" class="cursor-pointer" size="24px" color="info">
                        <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
                            Usuário e senha do CEI utilizados para processar suas informações.
                        </q-menu>
                    </q-icon>
                </q-card-section>

                <q-separator />

                <q-card-section style="max-height: 50vh" class="scroll">

                    <q-card-section>
                        <q-item-label header>Quais ações devem ter o valor atualizado?</q-item-label>
                        <q-radio v-model="configuration.which" val="all" label="Todas" />
                        <q-radio v-model="configuration.which" val="balance" label="As que possuem saldo" />
                        <q-radio v-model="configuration.which" val="none" label="Nenhuma" />

                        <q-item-label header>Quantas ações devem ser atualizadas por tick?</q-item-label>
                        <q-input v-model="configuration.many" type="number" filled/>

                        <q-item-label header>Qual o intervalo, em minutos, entre cada tick?</q-item-label>
                        <q-input v-model="configuration.when" type="number" filled/>
                    </q-card-section>

                    <q-separator />

                    <q-card-section>

                        <q-item-label header>Resumo</q-item-label>
                        {{ configSummary }}

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
            configuration: {
                which: 'all',
                many: 5,
                when: 15
            },
            tableLoading: false,
            showCreateForm: false,
            configDialog: false,
            pagination: {
                rowsPerPage: 50
            },
            visibleColumns: [ 'code', 'quantityBought', 'quantitySold', 'quantityBalance', 'valueBought', 'valueSold', 'price', 'totalValue', 'source' ],
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
            }
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
        init() {
            ipcRenderer.send('wallet/get');
            setTimeout(() => {
                ipcRenderer.send('wallet/update-last-value', { stocks: this.data.slice(0, 2).map(o => o.code) });
            }, 2000);
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
                        totalValue: 0,
                        source: d.source
                    };
                })
                .sort((a, b) => a.code < b.code ? -1 : (a.code > b.code ? 1 : 0));
        },
        configSummary() {
            if (this.configuration.which === 'none') {
                return 'Nenhum valor de ação será atualizado automaticamente';
            }

            let many = this.dataTable.length;
            if (this.configuration.which === 'balance') {
                many = this.dataTable.filter(d => d.quantityBalance > 0).length;
            }

            const interval = (Math.max(1, many / this.configuration.many) * this.configuration.when).toFixed(2);

            let msg = `${many} ações serão atualizadas.`;
            msg += `A cada ${this.configuration.when} minuto(s), ${this.configuration.many} ações serão atualizadas.`;
            msg += `Isso significa que uma mesma ação será atualizada a cada ${interval} minutos.`;

            return msg;
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

        ipcRenderer.on('wallet/update-last-value', (event, response) => {
            for (const r of response.data) {
                for (const d of this.data) {
                    if (r.code === d.code) {
                        d.price = r.price;
                        d.changePrice = r.changePrice;
                        d.changePercent = r.changePercent;
                        d.lastTradingDay = r.lastTradingDay;
                        break;
                    }
                }
            }
        });

        this.init();
    }
};
</script>

<style lang="scss">

    .filter {
        text-align: right;
    }

    .table-container {

        .q-table__middle {
            max-height: 500px;
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
                    tr:nth-child(odd) {
                        background: #f7f7f7;
                    }
                }
            }

        }
    }

</style>
