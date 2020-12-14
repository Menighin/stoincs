<template>
    <q-table
        class="table-container q-mx-lg group-header-table"
        table-class="data-table sticky-last-column"
        title="Carteira de ações"
        :data="data"
        :columns="columns"
        :row-key="rowKey"
        flat
        bordered
        :rows-per-page-options="[50, 100, 150]"
        rows-per-page-label="Items por página"
        :pagination.sync="paginationData"
        :visible-columns="visibleColumns"
        :loading="loading"
        ref="table"
        v-dynamic-height="{ heightOffset: 250, innerSelector: '.q-table__middle' }">

        <div slot="header" slot-scope="props" style="display: contents" class="group-header">
            <q-tr>
                <template v-for="col in groupHeaderColumns">
                    <q-th v-if="col.name" :props="props" :key="col.name" :colspan="col.colspan" :rowspan="col.rowspan" class="group-cell">{{ col.label }}</q-th>
                    <q-th v-else :key="col.label" :colspan="col.colspan" :rowspan="col.rowspan" class="group-cell">{{ col.label }}</q-th>
                </template>
            </q-tr>
            <q-tr>
                <q-th :props="props" v-for="col in groupChildrenColumns" :key="col.name" class="child-cell">{{ col.label }}</q-th>
            </q-tr>
        </div>

        <slot v-for="(_, name) in $slots" :name="name" :slot="name" />
        <template v-for="(_, name) in $scopedSlots" :slot="name" slot-scope="slotData"><slot :name="name" v-bind="slotData" /></template>

    </q-table>
</template>

<script>
export default {
    props: ['data', 'columns', 'row-key', 'pagination', 'visible-columns', 'loading'],
    data() {
        return {
            paginationData: null
        };
    },
    computed: {
        visibleColumnsComputed() {
            return this.columns.filter(c => this.visibleColumns.includes(c.name) || c.alwaysShow);
        },
        groupHeaderColumns() {
            return this.visibleColumnsComputed.reduce((p, c) => {
                const last = p.last();
                const lastGroupHeader = last ? last.label : null;
                if (lastGroupHeader === c.groupHeader) {
                    last.colspan++;
                } else {
                    p.push({
                        name: c.groupHeader ? undefined : c.name,
                        label: c.groupHeader || c.label,
                        rowspan: c.groupHeader ? 1 : 2,
                        colspan: 1
                    });
                }
                return p;
            }, []);
        },
        groupChildrenColumns() {
            const headerColumns = this.groupHeaderColumns.map(c => c.label);
            return this.visibleColumnsComputed.filter(o => headerColumns.includes(o.groupHeader));
        }
    },
    created() {
        this.paginationData = this.pagination;
    }
};
</script>

<style lang="scss">
    .group-header-table {
        .group-header {
            tr {
                height: 32px;
            }
            th {
                vertical-align: middle;
                &.child-cell {
                    top: 32px;
                    z-index: 2 !important;
                }
            }
        }
    }
</style>
