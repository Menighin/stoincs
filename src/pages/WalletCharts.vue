<template>
    <q-page class='flex flex-center'>
        <highcharts :options='chartOptions' />
    </q-page>
</template>

<script>

import { Chart } from 'highcharts-vue';
import Highcharts from 'highcharts';
import treemapInit from 'highcharts/modules/treemap';
import { ipcRenderer } from 'electron';

treemapInit(Highcharts);

export default {
    name: 'PageWalletCharts',
    components: {
        highcharts: Chart
    },
    data() {
        return {
            data: [],
            chartOptions2: {
                series: [{
                    type: 'treemap',
                    layoutAlgorithm: 'stripes',
                    alternateStartingDirection: true,
                    levels: [{
                        level: 1,
                        layoutAlgorithm: 'sliceAndDice',
                        dataLabels: {
                            enabled: true,
                            align: 'left',
                            verticalAlign: 'top',
                            style: {
                                fontSize: '15px',
                                fontWeight: 'bold'
                            }
                        }
                    }],
                    data: []
                }],
                title: {
                    text: 'Fruit consumption'
                }
            }
        };
    },
    methods: {
    },
    computed: {
        chartOptions() {
            const rawData = this.data.filter(o => o.quantityBought - o.quantitySold > 0);

            const groups = [...new Set(rawData.map(o => o.label))]
                .map(o => ({
                    id: o || 'Sem label',
                    name: o
                }));

            const data = rawData.map(o => ({
                name: o.code,
                value: o.quantityBought - o.quantitySold,
                parent: o.label || 'Sem label'
            }));

            return {
                series: [{
                    type: 'treemap',
                    layoutAlgorithm: 'stripes',
                    alternateStartingDirection: true,
                    levels: [{
                        level: 1,
                        layoutAlgorithm: 'sliceAndDice',
                        dataLabels: {
                            enabled: true,
                            align: 'left',
                            verticalAlign: 'top',
                            style: {
                                fontSize: '15px',
                                fontWeight: 'bold'
                            }
                        }
                    }],
                    data: [...groups, ...data]
                }],
                title: {
                    text: 'Ações'
                }
            };
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

        ipcRenderer.send('wallet/get');
    }
};
</script>
