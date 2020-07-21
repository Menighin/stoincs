<template>
    <q-page class="chart-page" ref="chartPage">
        <q-tabs v-model="tab" class="text-secondary" active-color="accent">
            <q-tab name="treemap" label="Treemap" />
            <q-tab name="bars" label="Barras" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated class="chart-panel" ref="chartPanel">
            <q-tab-panel name="treemap">
                <highcharts ref="treemapChart" class="chart" :options="treemapOptions" v-if="data.length > 0" />
                <div class="no-data" v-else>
                    <h5>Não há dados para este gráfico <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
                    <span>
                        Configure seu acesso ao CEI ou insira negociações manualmente.
                    </span>
                </div>
            </q-tab-panel>

            <q-tab-panel name="bars">
                <q-checkbox label="Mostrar coluna de total" v-model="barChartShowTotal" />
                <div style="height: 90%">
                    <highcharts ref="barChart" class="chart" :options="barOptions" v-if="data.length > 0" />
                    <div class="no-data" v-else>
                        <h5>Não há dados para este gráfico <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
                        <span>
                            Configure seu acesso ao CEI ou insira negociações manualmente.
                        </span>
                    </div>
                </div>
            </q-tab-panel>
        </q-tab-panels>
    </q-page>
</template>

<script>

import { Chart } from 'highcharts-vue';
import Highcharts from 'highcharts';
import treemapInit from 'highcharts/modules/treemap';
import waterfallInit from 'highcharts/highcharts-more';
import { ipcRenderer } from 'electron';
import HighchartUtils, { SeriesColors } from '../utils/HighchartUtils';
import NumberUtils from '../../src-electron/utils/NumberUtils';

treemapInit(Highcharts);
waterfallInit(Highcharts);

export default {
    name: 'PageWalletCharts',
    components: {
        highcharts: Chart
    },
    data() {
        return {
            treasuryDirect: [],
            tab: null,
            barChartShowTotal: false
        };
    },
    methods: {
    },
    computed: {
        data() {
            return this.treasuryDirect;
        },
        treemapOptions() {
            const totalValue = this.data.reduce((prev, curr) => {
                return prev + curr.netValue;
            }, 0);

            const data = this.data.map((o, i) => ({
                name: o.code,
                value: o.netValue,
                investedValue: o.investedValue,
                grossValue: o.grossValue,
                quantity: o.quantity,
                leaf: true,
                percentage: o.netValue / totalValue,
                color: SeriesColors[i % SeriesColors.length]
            }));

            return {
                series: [{
                    type: 'treemap',
                    layoutAlgorithm: 'squarified',
                    alternateStartingDirection: true,
                    data: data,
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
                                name: 'Valor Investido',
                                value: NumberUtils.formatCurrency(this.investedValue),
                                color: SeriesColors[1 % SeriesColors.length]
                            },
                            {
                                name: 'Valor Liquido',
                                value: NumberUtils.formatCurrency(this.value),
                                color: SeriesColors[2 % SeriesColors.length]
                            },
                            {
                                name: 'Valor Bruto',
                                value: NumberUtils.formatCurrency(this.grossValue),
                                color: SeriesColors[3 % SeriesColors.length]
                            },
                            {
                                name: 'Quantidade',
                                value: this.quantity,
                                color: SeriesColors[4 % SeriesColors.length]
                            }
                        ];

                        return HighchartUtils.getTooltipContent(this.name, items);
                    }
                }
            };
        },
        barOptions() {
            let categories = [];
            let seriesBoughtValue = [];
            let seriesActualValue = [];

            for (const d of this.data) {
                categories.push(d.code);
                seriesBoughtValue.push(d.investedValue);
                seriesActualValue.push(d.netValue);
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
                    name: 'Valor Investido',
                    color: SeriesColors[0],
                    data: seriesBoughtValue,
                    tooltip: {
                        valuePrefix: 'R$'
                    },
                    pointPadding: 0
                }, {
                    name: 'Valor Atual Liquido',
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
        ipcRenderer.on('treasury-direct/get', (event, response) => {
            if (response.status === 'success') {
                this.treasuryDirect = response.data;
                this.treasuryDirect.forEach(t => {
                    t.expirationDate = new Date(t.expirationDate);
                    t.lastUpdated = new Date(t.lastUpdated);
                });
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar tesouro direto` });
                console.error(response);
            }
        });

        ipcRenderer.send('treasury-direct/get');

        setTimeout(() => {
            this.tab = 'treemap';
            this.$refs.chartPanel.$el.style.height = `${this.$refs.chartPage.$el.clientHeight - 100}px`;

            setTimeout(() => {
                if (this.$refs.treemapChart) this.$refs.treemapChart.chart.reflow();
            }, 200);
        }, 200);
    }
};
</script>

<style lang="scss" scoped>
    .chart-page {
        padding: 10px 20px;

        .no-data {
            padding-top: 100px;
        }
    }
</style>
