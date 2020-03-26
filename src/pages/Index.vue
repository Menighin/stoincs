<template>
    <q-page class="flex flex-center">
        <img alt="Quasar logo" src="~assets/snout.svg" v-show="false">
        <inline-svg
            src="img/snout.svg"
            fill="black"
            style="transform: scale(2)"
            aria-label="Porquinho Digital Logo"
        ></inline-svg>
    </q-page>
</template>

<script>
import InlineSvg from 'vue-inline-svg';

export default {
    name: 'PageIndex',
    components: {
        InlineSvg
    }
};
</script>

<style lang="scss">
    #pig-snout-svg {
        transition: transform .5s;
    }
</style>
