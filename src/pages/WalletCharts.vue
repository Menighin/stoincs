<template>
    <q-page class="chart-page" ref="chartPage">

        <q-tabs v-model="tab" class="text-secondary" active-color="accent">
            <q-tab name="treemap" label="Treemap" />
            <q-tab name="bars" label="Barras" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated class="chart-panel" ref="chartPanel">
            <q-tab-panel name="treemap">
                <highcharts ref="treemapChart" class="chart" :options="treemapOptions" />
            </q-tab-panel>

            <q-tab-panel name="bars">
                <q-checkbox label="Somente ações na carteira" v-model="barChartInWallet" />
                <q-checkbox label="Mostrar coluna de total" v-model="barChartShowTotal" />
                <div style="height: 90%">
                    <highcharts ref="barChart" class="chart" :options="barOptions" />
                </div>
            </q-tab-panel>
        </q-tab-panels>

    </q-page>
</template>

<script>

import { Chart } from 'highcharts-vue';
import Highcharts from 'highcharts';
import treemapInit from 'highcharts/modules/treemap';
import { ipcRenderer } from 'electron';
import HighchartUtils, { SeriesColors } from '../utils/HighchartUtils';
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
            tab: null,
            barChartInWallet: true,
            barChartShowTotal: false
        };
    },
    methods: {
    },
    computed: {
        treemapOptions() {
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
                    text: null
                },
                tooltip: {
                    useHTML: true,
                    pointFormatter: function() {
                        const items = [
                            {
                                name: 'Porcentagem',
                                value: NumberUtils.formatPercentage(this.percentage * 100, false),
                                color: SeriesColors[0 % SeriesColors.length]
                            },
                            {
                                name: 'Valor',
                                value: NumberUtils.formatCurrency(this.value),
                                color: SeriesColors[1 % SeriesColors.length]
                            },
                            {
                                name: 'Quantidade',
                                value: this.quantity,
                                color: SeriesColors[2 % SeriesColors.length]
                            }
                        ];

                        if (this.leaf)
                            items.push({
                                name: 'Preço atual',
                                value: NumberUtils.formatCurrency(this.price),
                                color: SeriesColors[3 % SeriesColors.length]
                            });

                        return HighchartUtils.getTooltipContent(this.name, items);
                    }
                }
            };
        },
        barOptions() {
            const rawData = this.data.filter(o => o.quantityBought - o.quantitySold > 0 || !this.barChartInWallet);

            let categories = [];
            let seriesBoughtValue = [];
            let seriesActualValue = [];

            for (const d of rawData) {
                categories.push(d.code);
                seriesBoughtValue.push(d.valueBought);
                seriesActualValue.push(d.valueSold + Math.max(d.quantityBought - d.quantitySold, 0) * d.price);
            }

            if (this.barChartShowTotal) {
                categories = ['Total', ...categories];
                seriesBoughtValue = [seriesBoughtValue.reduce((p, c) => p + c), ...seriesBoughtValue];
                seriesActualValue = [seriesActualValue.reduce((p, c) => p + c), ...seriesActualValue];
            }

            return {
                chart: {
                    type: 'column'
                },
                title: {
                    text: null
                },
                xAxis: {
                    categories: categories
                },
                yAxis: [{
                    min: 0,
                    title: {
                        text: 'Valor'
                    }
                }],
                tooltip: {
                    shared: true,
                    formatter: function() {
                        const items = this.points.map(p => ({
                            name: p.series.name,
                            value: NumberUtils.formatCurrency(p.y),
                            color: p.color
                        }));

                        // The result
                        items.push({
                            name: 'Balanço',
                            value: NumberUtils.formatCurrency(this.points[1].y - this.points[0].y, true),
                            color: SeriesColors[3]
                        });

                        return HighchartUtils.getTooltipContent(this.x, items);
                    }
                },
                plotOptions: {
                    column: {
                        grouping: false,
                        borderWidth: 0
                    }
                },
                series: [{
                    name: 'Compra',
                    color: SeriesColors[0],
                    data: seriesBoughtValue,
                    tooltip: {
                        valuePrefix: 'R$'
                    },
                    pointPadding: 0
                }, {
                    name: 'Valor Atual',
                    color: SeriesColors[1],
                    data: seriesActualValue,
                    tooltip: {
                        valuePrefix: 'R$'
                    },
                    pointPadding: 0.25
                }]
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

        setTimeout(() => {
            this.tab = 'treemap';
            this.$refs.chartPanel.$el.style.height = `${this.$refs.chartPage.$el.clientHeight - 100}px`;
            this.$refs.treemapChart.chart.reflow();
        }, 200);
    }
};
</script>

<style lang="scss" scoped>
    .chart-page {
        padding: 10px 20px;

        .chart-panel {
            text-align: center;
            .chart {
                margin: 0 auto;
                width: 100%;
                min-height: 600px;
                height: 100%;
            }
        }
    }
</style>
