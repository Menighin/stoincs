<template>
    <div class="snout-loader">
        <div class="message" ref="message" v-show="item !== null">{{ message }}</div>
        <div class="svg">
            <inline-svg
                src="img/snout.svg"
                fill="black"
                style="transform: scale(0)"
                viewBox="0 0 128 128"
                width="32"
                height="32"
                id="snout-loader"
                ref="snoutLoader"
                aria-label="Porquinho Digital Logo"
            ></inline-svg>
        </div>
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
            loading: [],
            item: null
        };
    },
    computed: {
        message() {
            if (this.item === null)
                return '';
            return this.loading[this.item].message;
        }
    },
    mounted() {
        const self = this;
        EventBus.$on('snout-loader-start', (evt) => {
            self.loading.push(evt);
            self.$refs.snoutLoader.$el.getElementById('snout-fill').style.fill = 'url("#gradient-2")';
            self.$refs.snoutLoader.$el.classList.add('loading');

            if (this.item === null)
                this.item = 0;
        });

        EventBus.$on('snout-loader-finish', (evtCode) => {
            self.loading = self.loading.filter(e => e.code !== evtCode);
            if (self.loading.length === 0) {
                self.$refs.snoutLoader.$el.getElementById('snout-fill').style.fill = 'url("#gradient-1")';
                self.$refs.snoutLoader.$el.classList.remove('loading');
                this.item = null;
                this.$refs.message.style.width = `10px`;
            } else {
                this.item %= this.loading.length;
            }
        });

        EventBus.$on('snout-loader-show', () => {
            self.$refs.snoutLoader.$el.classList.remove('bounce-out');
            self.$refs.snoutLoader.$el.classList.add('bounce-in');
        });

        EventBus.$on('snout-loader-hide', () => {
            self.$refs.snoutLoader.$el.classList.remove('bounce-in');
            self.$refs.snoutLoader.$el.classList.add('bounce-out');
        });

        setInterval(() => {
            if (this.item === null) return;
            this.item = (this.item + 1) % this.loading.length;

            const fakeDiv = document.createElement('div');
            document.body.appendChild(fakeDiv);
            fakeDiv.classList.add('snout-loader');
            fakeDiv.classList.add('message');
            fakeDiv.style.position = 'absolute';
            fakeDiv.style.left = -1000;
            fakeDiv.style.top = -1000;

            fakeDiv.innerText = this.loading[this.item].message;
            const width = fakeDiv.clientWidth;
            setTimeout(() => {
                this.$refs.message.style.width = `${width + 20}px`;
            }, 200);

            if (this.loading.length > 1)
                this.$refs.message.style.width = `10px`;

            document.body.removeChild(fakeDiv);
        }, 2000);
    }
};
</script>

<style lang="scss" scoped>
    .snout-loader {
        text-align: right;
        .message {
            background: white;
            display: inline-block;
            padding: 2px 0px;
            margin-right: 5px;
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            vertical-align: middle;
            border: 1px solid #ddd;
            border-radius: 6px;
            transition: all .2s linear;
            white-space: nowrap;
            width: 10px;
            overflow: hidden;
            text-align: center;
            text-transform: uppercase;
            font-size: 11px;
            margin-bottom: 4px;
            min-height: 15px;
        }

        .svg {
            display: inline-block;
            vertical-align: middle;
        }

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
    }
</style>
