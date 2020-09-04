<template>
    <q-form @submit="$emit('submit', form)" class="q-gutter-md">
        <q-card-section class="row items-center">
            <div class="q-gutter-md q-ma-md" style="width: 400px; max-width: 500px">
                <div class="text-h5">{{ title }}</div>

                <template v-for="f in fields">
                    <q-input
                        v-if="f.type === 'text'"
                        :key="f.id"
                        class="q-ma-sm"
                        style="padding-bottom: 0"
                        filled
                        v-model="form[f.id]"
                        :fill-mask="f.fillMask"
                        :mask="f.mask"
                        :reverse-fill-mask="f.reverseFillMask"
                        :label="f.label"
                        lazy-rules
                        :rules="[ val => val && val != null ]"
                    />

                    <q-select
                        v-if="f.type === 'autocomplete'"
                        :key="f.id"
                        filled
                        v-model="form[f.id]"
                        :label="f.label"
                        use-input
                        clearable
                        new-value-mode="add-unique"
                        :options="filteredOptions[f.id]"
                        @filter="(val, update) => filterOptionsFn(val, update, f.id)"
                        @input-value="(v) => partialInput[f.id] = v"
                        @blur="blurSelect(f.id)"
                        lazy-rules
                        class="q-ma-sm" style="padding-bottom: 0"
                        :rules="[ val => val && val.length > 0 || '']"
                    />

                    <q-select
                        v-if="f.type === 'select'"
                        :key="f.id"
                        :options="f.options"
                        style="padding-bottom: 0"
                        class="q-ma-sm"
                        filled
                        v-model="form[f.id]"
                        :label="f.label"
                        lazy-rules
                        :rules="[ val => val && val.toString().length > 0 || '']"
                    />

                    <q-input
                        v-if="f.type === 'date'"
                        :key="f.id"
                        class="q-ma-sm"
                        style="padding-bottom: 0"
                        filled
                        v-model="form[f.id]"
                        mask="##/##/####"
                        :label="f.label"
                        lazy-rules
                        :rules="[ val => val && val.length > 0 || '']">
                        <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy ref="qDateProxy" transition-show="scale" transition-hide="scale">
                                    <q-date mask="DD/MM/YYYY" v-model="form[f.id]" @input="() => $refs.qDateProxy.forEach(o => o.hide())" />
                                </q-popup-proxy>
                            </q-icon>
                        </template>
                    </q-input>
                </template>
            </div>
        </q-card-section>
        <q-card-actions align="right">
            <q-btn flat label="Cancelar" color="primary" @click="$emit('cancel')" />
            <q-btn flat label="Salvar" type="submit" color="primary" />
        </q-card-actions>
    </q-form>
</template>

<script>
export default {
    name: 'CreateItemForm',
    props: {
        fields: {
            type: Array,
            default: () => []
        },
        title: {
            type: String
        }
    },
    data() {
        return {
            form: {},
            partialInput: {},
            filteredOptions: {}
        };
    },
    methods: {
        filterOptionsFn(val, update, id) {
            const self = this;
            update(() => {
                const options = self.fields.first(o => o.id === id).options;
                if (val === '') {
                    self.$set(self.filteredOptions, id, options);
                } else {
                    const needle = val.toLowerCase();
                    self.$set(self.filteredOptions, id, options.filter(
                        v => v.toLowerCase().indexOf(needle) > -1
                    ));
                }
            });
        },
        blurSelect(id) {
            if (this.partialInput[id] && this.partialInput[id].length > 0)
                this.form[id] = this.partialInput[id];
        }
    }
};
</script>

<style>

</style>
