<template>
    <q-page class='flex flex-center' ref="chartPage">
        <highcharts ref="treemapChart" class="chart" :options='chartOptions' />
    </q-page>
</template>

<script>

import { Chart } from 'highcharts-vue';
import Highcharts from 'highcharts';
import treemapInit from 'highcharts/modules/treemap';
import { ipcRenderer } from 'electron';
import { SeriesColors } from '../utils/HighchartColors';
import NumberUtils from '../../src-electron/utils/NumberUtils';

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

            const totalValue = rawData.reduce((prev, curr) => {
                return prev + (curr.quantityBought - curr.quantitySold) * curr.price;
            }, 0);

            const groups = [...new Set(rawData.map(o => o.label))]
                .map((o, i) => ({
                    id: o && o.length > 0 ? o : 'Sem label',
                    name: o && o.length > 0 ? o : 'Sem label',
                    color: SeriesColors[i % SeriesColors.length],
                    ...rawData.filter(r => r.label === o).reduce((prev, curr) => {
                        const quantity = curr.quantityBought - curr.quantitySold;
                        prev.quantity += quantity;
                        prev.value += quantity * curr.price;
                        return prev;
                    }, { quantity: 0, value: 0 })
                }));

            groups.forEach(o => {
                o.percentage = o.value / totalValue;
            });

            const data = rawData.map(o => ({
                name: o.code,
                value: (o.quantityBought - o.quantitySold) * o.price,
                quantity: (o.quantityBought - o.quantitySold),
                price: o.price,
                parent: o.label && o.label.length > 0 ? o.label : 'Sem label',
                leaf: true,
                percentage: (o.quantityBought - o.quantitySold) * o.price / totalValue
            }));

            return {
                series: [{
                    type: 'treemap',
                    layoutAlgorithm: 'squarified',
                    alternateStartingDirection: true,
                    levels: [{
                        level: 1,
                        layoutAlgorithm: 'squarified',
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
                    data: [...groups, ...data],
                    dataLabels: {
                        useHTML: true,
                        formatter: function() {
                            if (this.point.leaf)
                                return `<div style="text-align: center">${this.point.name}<br />${NumberUtils.formatPercentage(this.percentage * 100, false)}</div>`;
                            else
                                return `${this.point.name}<br />${NumberUtils.formatPercentage(this.percentage * 100, false)}`;
                        }
                    }
                }],
                title: {
                    text: 'Ações'
                },
                tooltip: {
                    useHTML: true,
                    pointFormatter: function() {
                        let content = '<ul style="margin-left: -15px; padding-right: 10px;">';
                        content += `<li><strong>Porcentagem:</strong> ${NumberUtils.formatPercentage(this.percentage * 100, false)}</li>`;
                        content += `<li><strong>Valor:</strong> ${NumberUtils.formatCurrency(this.value)}</li>`;
                        content += `<li><strong>Quantidade:</strong> ${this.quantity}</li>`;

                        if (this.leaf)
                            content += `<li><strong>Preço atual:</strong> ${NumberUtils.formatCurrency(this.price)}</li>`;

                        content += '</ul>';
                        return content;
                    }
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

<style lang="scss" scoped>
    .chart {
        width: 90%;
        min-height: 600px;
    }
</style>
