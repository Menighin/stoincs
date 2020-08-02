<template>
    <q-page class="chart-page" ref="chartPage">

        <q-tabs v-model="tab" class="text-secondary" active-color="accent">
            <q-tab name="treemap" label="Treemap" />
            <q-tab name="bars" label="Barras" />
            <q-tab name="waterfall" label="Waterfall" />
        </q-tabs>

        <q-tab-panels v-model="tab" animated class="chart-panel" ref="chartPanel">
            <q-tab-panel name="treemap">
                <q-radio label="Valor investido" v-model="treemapRadio" val="invested" />
                <q-radio label="Valor atual" v-model="treemapRadio" val="actual" />
                <div style="height: 90%">
                    <highcharts ref="treemapChart" class="chart" :options="treemapOptions" v-if="data.length > 0 && treemapOptions != null" />
                    <div class="no-data" v-else>
                        <h5>Não há dados para este gráfico <q-icon size="2em" name="sentiment_dissatisfied" /></h5><br/>
                        <span>
                            Configure seu acesso ao CEI ou insira negociações manualmente. É necessário ter preços atualizados na sua Carteira para plotar este gráfico.
                        </span>
                    </div>
                </div>
            </q-tab-panel>

            <q-tab-panel name="bars">
                <q-checkbox label="Somente ações na carteira" v-model="barChartInWallet" />
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
            <q-tab-panel name="waterfall">
                <q-select :options="waterfallOptions" v-model="waterfallSelected" filled dense style="width: 200px; margin: 0 0 0 auto;" />
                <div style="height: 90%">
                    <highcharts ref="waterfallChart" class="chart" :options="waterfallChartOptions" v-if="data.length > 0" />
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
import NumberUtils from '../../src-shared/utils/NumberUtils';

treemapInit(Highcharts);
waterfallInit(Highcharts);

export default {
    name: 'PageWalletCharts',
    components: {
        highcharts: Chart
    },
    data() {
        return {
            stockPrices: {},
            consolidated: [],
            walletLabels: {},
            tab: null,
            treemapRadio: 'invested',
            barChartInWallet: true,
            barChartShowTotal: false,
            waterfallSelected: null,
            waterfallOptions: []
        };
    },
    methods: {
    },
    computed: {
        data() {
            return this.consolidated.map(c => {
                const price = this.stockPrices[c.code] ? (this.stockPrices[c.code].price || 0) : 0;
                const actualValue = (c.quantityBought - c.quantitySold) * price;
                const averageValueBought = (c.quantityBought - c.quantitySold) * c.averageBuyPrice;
                const historicPosition = c.valueSold + actualValue - c.valueBought;
                return {
                    ...c,
                    actualValue: actualValue,
                    averageValueBought: averageValueBought,
                    historicPosition: historicPosition,
                    price: price,
                    label: this.walletLabels[c.code]
                };
            });
        },
        treemapOptions() {
            const rawData = this.data.filter(o => o.quantityBought - o.quantitySold > 0);
            const investedOnly = this.treemapRadio === 'invested';

            const totalValue = rawData.reduce((prev, curr) => {
                return prev + (investedOnly ? curr.averageValueBought : curr.actualValue);
            }, 0);

            const groups = [...new Set(rawData.map(o => o.label))]
                .map((o, i) => ({
                    id: o && o.length > 0 ? o : 'Sem label',
                    name: o && o.length > 0 ? o : 'Sem label',
                    color: SeriesColors[i % SeriesColors.length],
                    ...rawData.filter(r => r.label === o).reduce((prev, curr) => {
                        const quantity = curr.quantityBought - curr.quantitySold;
                        prev.quantity += quantity;
                        prev.value += (investedOnly ? curr.averageValueBought : curr.actualValue);
                        return prev;
                    }, { quantity: 0, value: 0 })
                }));

            groups.forEach(o => {
                o.percentage = o.value / totalValue;
            });

            const data = rawData.map(o => ({
                name: o.code,
                value: investedOnly ? o.averageValueBought : o.actualValue,
                quantity: o.quantityBought - o.quantitySold,
                price: o.price,
                averageBuyPrice: o.averageBuyPrice,
                parent: o.label && o.label.length > 0 ? o.label : 'Sem label',
                leaf: true,
                percentage: (investedOnly ? o.averageValueBought : o.actualValue) / totalValue
            }));

            if (!data.reduce((p, c) => p || c.value > 0, false))
                return null;

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

                        if (this.leaf) {
                            items.push({
                                name: 'Preço atual',
                                value: NumberUtils.formatCurrency(this.price),
                                color: SeriesColors[3 % SeriesColors.length]
                            });

                            items.push({
                                name: 'Preço médio de compra',
                                value: NumberUtils.formatCurrency(this.averageBuyPrice),
                                color: SeriesColors[4 % SeriesColors.length]
                            });
                        }

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
            let seriesDividends = [];

            for (const d of rawData) {
                categories.push(d.code);
                seriesBoughtValue.push(d.valueBought);
                seriesActualValue.push(d.valueSold + Math.max(d.quantityBought - d.quantitySold, 0) * d.price);
                seriesDividends.push(d.dividends);
            }

            if (this.barChartShowTotal) {
                categories = ['Total', ...categories];
                seriesBoughtValue = [seriesBoughtValue.reduce((p, c) => p + c), ...seriesBoughtValue];
                seriesActualValue = [seriesActualValue.reduce((p, c) => p + c), ...seriesActualValue];
                seriesDividends = [seriesDividends.reduce((p, c) => p + c), ...seriesDividends];
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
                            value: NumberUtils.formatCurrency(this.points[1].y + this.points[2].y - this.points[0].y, true),
                            color: SeriesColors[3]
                        });

                        return HighchartUtils.getTooltipContent(this.x, items);
                    }
                },
                plotOptions: {
                    column: {
                        grouping: false,
                        borderWidth: 0,
                        stacking: 'normal'
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
                    name: 'Dividendos',
                    color: SeriesColors[2],
                    data: seriesDividends,
                    tooltip: {
                        valuePrefix: 'R$'
                    },
                    pointPadding: 0.25,
                    stack: 'profit'
                }, {
                    name: 'Valor Atual',
                    color: SeriesColors[1],
                    data: seriesActualValue,
                    tooltip: {
                        valuePrefix: 'R$'
                    },
                    pointPadding: 0.25,
                    stack: 'profit'
                }]
            };
        },
        waterfallChartOptions() {
            const data = this.data.filter(o => o.code === this.waterfallSelected)[0];

            if (!data)
                return;

            return {
                chart: {
                    type: 'waterfall'
                },
                title: {
                    text: null
                },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    title: {
                        text: 'R$'
                    },
                    plotLines: [{
                        value: 0,
                        color: '#000000',
                        width: 3,
                        zIndex: 1
                    }]
                },
                legend: {
                    enabled: false
                },

                tooltip: {
                    pointFormat: '<b>R$ {point.y:,.2f}</b>'
                },

                series: [{
                    upColor: SeriesColors[1],
                    color: SeriesColors[0],
                    data: [{
                        name: 'Compra',
                        y: -data.valueBought
                    }, {
                        name: 'Vendido',
                        y: data.valueSold
                    }, {
                        name: 'Ativo',
                        y: (data.quantityBought - data.quantitySold) * data.price
                    }, {
                        name: 'Dividendos',
                        y: data.dividends
                    }, {
                        name: 'Balanço',
                        isSum: true,
                        color: SeriesColors[2]
                    }],
                    dataLabels: {
                        enabled: true,
                        formatter: function() {
                            return `R$ ${Highcharts.numberFormat(this.y, 2, ',')}`;
                        }
                    },
                    pointPadding: 0
                }]
            };
        }
    },
    mounted() {
        ipcRenderer.on('wallet/get', (event, response) => {
            if (response.status === 'success') {
                this.walletLabels = response.data.reduce((p, c) => { p[c.code] = c.label; return p }, {});
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

        ipcRenderer.on('stockHistory/consolidated', (event, response) => {
            if (response.status === 'success') {
                this.consolidated = response.data;
                this.waterfallOptions = response.data.map(o => o.code).sort();
                this.waterfallSelected = this.waterfallOptions[0];
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar dados consolidados` });
                console.error(response);
            }
        });

        ipcRenderer.send('stock-prices/get');
        ipcRenderer.send('wallet/get');
        ipcRenderer.send('stockHistory/consolidated');

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
        padding: 10px 60px;

        .no-data {
            padding-top: 100px;
        }
    }
</style>
