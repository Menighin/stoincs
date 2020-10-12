<template>
    <q-page class="income-tax q-ma-none q-px-lg">
        <div class="filter">
            <q-select
                v-model="selectedYear"
                outlined
                dense
                options-dense
                label="Ano"
                :options="yearOptions"
                @input="getConsolidatedData"
                class="q-ma-sm"
                style="width: 100px; display: inline-block;"
            />
        </div>

        <q-table
            class="table-container q-mx-lg"
            table-class="data-table sticky-last-column sticky-first-column"
            title="Sumário mensal"
            :data="monthlySummary"
            :columns="monthlySummaryColumns"
            row-key="row => `${row.code}-${row.id}`"
            flat
            ref="monthlySummaryTable"
            bordered
            :rows-per-page-options="[12]"
            rows-per-page-label="Items por página"
            :hide-pagination="true"
            v-dynamic-height="{ heightOffset: 300, innerSelector: '.q-table__middle' }"
        />
    </q-page>
</template>

<script>

import { ipcRenderer } from 'electron';
import NumberUtils from '../../src-shared/utils/NumberUtils';
import DateUtils from '../../src-shared/utils/DateUtils';

export default {
    name: 'PageIncomeTax',
    data() {
        return {
            historyData: [],
            consolidatedData: [],
            dividends: [],
            selectedYear: null,
            yearOptions: [],
            months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
        };
    },
    methods: {
        init() {
            ipcRenderer.send('stockHistory/get');
            ipcRenderer.send('dividends/get');
        },
        getConsolidatedData() {
            const startDate = new Date(`${this.selectedYear}-01-01`);
            const endDate = new Date(`${this.selectedYear + 1}-01-01`);
            ipcRenderer.send('stockHistory/consolidated', { startDate: startDate, endDate: endDate });
        }
    },
    computed: {
        monthlySummaryColumns() {
            return [{
                name: 'operation',
                align: 'center',
                label: 'Operação',
                field: 'operation'
            },
            ...this.months.map(o => ({
                name: o,
                align: 'right',
                label: o,
                field: o,
                format: val => NumberUtils.formatNumber(val, 'R$ ')
            })),
            {
                name: 'total',
                align: 'right',
                label: 'Total',
                field: 'total',
                format: val => NumberUtils.formatNumber(val, 'R$ ')
            }
            ];
        },
        monthlySummary() {
            const baseData = this.months.reduce((p, c) => { p[c] = 0; return p }, {});
            baseData['total'] = 0;

            const buy = this.historyData
                .filter(o => o.date.getFullYear() === this.selectedYear && o.operation === 'C')
                .reduce((p, c) => {
                    const month = this.months[c.date.getMonth()];
                    p[month] += c.price * c.quantity;
                    p['total'] += c.price * c.quantity;
                    return p;
                }, { operation: 'Compra', ...baseData });

            const sell = this.historyData
                .filter(o => o.date.getFullYear() === this.selectedYear && o.operation === 'V')
                .reduce((p, c) => {
                    const month = this.months[c.date.getMonth()];
                    p[month] += c.price * c.quantity;
                    p['total'] += c.price * c.quantity;
                    return p;
                }, { operation: 'Venda', ...baseData });

            return [buy, sell];
        }
    },
    mounted() {
        ipcRenderer.on('stockHistory/get', (event, arg) => {
            this.historyData = arg.map(o => {
                o.date = new Date(o.date);
                return o;
            }).sort((s1, s2) => s2.date - s1.date);

            this.yearOptions = this.historyData
                .map(o => o.date.getFullYear())
                .distinct()
                .sort((a, b) => b - a);

            this.selectedYear = this.yearOptions.first();
            this.getConsolidatedData();
        });

        ipcRenderer.on('stockHistory/consolidated', (event, arg) => {
            this.tableLoading = false;
            if (arg.status === 'success')
                this.consolidatedData = arg.data;
            else {
                this.$q.notify({ type: 'negative', message: `Erro ao computar dados consolidados: ${arg.message}` });
                console.error(arg);
            }
        });

        ipcRenderer.on('dividends/get', (event, response) => {
            if (response.status === 'success') {
                this.dividends = response.data;
            } else {
                this.$q.notify({ type: 'negative', message: `Erro ao carregar dividendos` });
                console.error(response);
            }
        });

        this.init();
    }
};
</script>

<style lang="scss">

    .income-tax {
        .filter {
            text-align: right;
            width: 100%;
        }
    }
</style>
