<template>
    <q-page class="flex flex-center">
        <img alt="Quasar logo" src="~assets/snout.svg" v-show="false">
        <inline-svg
            src="img/snout.svg"
            fill="black"
            id="logo-svg"
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
    .bounce-out {
        animation: bounce-out .7s ease-in forwards;
    }

    @keyframes bounce-out {
        20% {
            transform: scale(2.5);
        }

        50% {
            transform: scale(0);
        }

        100% {
            transform: scale(0);
        }
      }
</style>
