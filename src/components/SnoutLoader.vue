<template>
    <div class="snout-loader">
        {{ loading }}
    </div>
</template>

<script>
import EventBus from './EventBus';

export default {
    data() {
        return {
            loading: ['SNOUT-LOADER']
        };
    },
    mounted() {
        EventBus.$on('snout-loader-start', (evtCode) => {
            this.loading.push(evtCode);
        });

        EventBus.$on('snout-loader-finish', (evtCode) => {
            this.loading.push(evtCode);
        });
    }
};
</script>
