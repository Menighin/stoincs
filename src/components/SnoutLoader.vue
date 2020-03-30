<template>
    <div class="snout-loader">
        <inline-svg
            src="img/snout.svg"
            fill="black"
            style="transform: scale(0)"
            viewBox="0 0 124 124"
            width="64"
            height="64"
            id="snout-loader"
            ref="snoutLoader"
            aria-label="Porquinho Digital Logo"
        ></inline-svg>
    </div>
</template>

<script>
import EventBus from './EventBus';
import InlineSvg from 'vue-inline-svg';

export default {
    components: {
        InlineSvg
    },
    data() {
        return {
            loading: ['SNOUT-LOADER']
        };
    },
    mounted() {
        const self = this;
        EventBus.$on('snout-loader-start', (evtCode) => {
            self.loading.push(evtCode);
        });

        EventBus.$on('snout-loader-finish', (evtCode) => {
            self.loading.push(evtCode);
        });

        EventBus.$on('snout-loader-show', () => {
            self.$refs.snoutLoader.$el.classList.remove('bounce-out');
            self.$refs.snoutLoader.$el.classList.add('bounce-in');
        });

        EventBus.$on('snout-loader-hide', () => {
            self.$refs.snoutLoader.$el.classList.remove('bounce-in');
            self.$refs.snoutLoader.$el.classList.add('bounce-out');
        });
    }
};
</script>

<style lang="scss" scoped>

    .bounce-out {
        animation: bounce-out .7s ease-in forwards;
    }

    .bounce-in {
        animation: bounce-in .7s ease-in forwards;
    }

    @keyframes bounce-out {
        20% {
            transform: scale(3);
        }

        100% {
            transform: scale(0);
        }
    }

    @keyframes bounce-in {
        20% {
            transform: scale(0);
        }

        80% {
            transform: scale(1.2);
        }

        100% {
            transform: scale(1);
        }
    }

</style>
