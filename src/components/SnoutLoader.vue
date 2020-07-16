<template>
    <div class="snout-loader" ref="snoutLoaderContainer">
        <div class="message" ref="message">{{ message }}</div>
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
            item: null,
            interval: null,
            progress: false
        };
    },
    computed: {
        message() {
            if (this.item === null || !this.loading[this.item])
                return '';
            return this.loading[this.item].message;
        }
    },
    methods: {
        tickMessage() {
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
                this.$refs.message.style.width = `0px`;

            document.body.removeChild(fakeDiv);
        }
    },
    mounted() {
        const self = this;
        EventBus.$on('snout-loader-start', (evt) => {
            self.loading.push(evt);
            if (!this.progress)
                self.$refs.snoutLoader.$el.getElementById('snout-fill').style.fill = 'url("#gradient-2")';
            self.$refs.snoutLoader.$el.classList.add('loading');

            if (this.item === null) {
                this.item = 0;
                this.tickMessage();
                this.interval = setInterval(() => { this.tickMessage() }, 2000);
            }
        });

        EventBus.$on('snout-loader-finish', (evtCode) => {
            const copyLoading = [ ...self.loading.filter(e => e.code !== evtCode) ];
            if (copyLoading.length === 0) {
                clearInterval(this.interval);
                setTimeout(() => {
                    self.loading = self.loading.filter(e => e.code !== evtCode);
                    if (!this.progress)
                        self.$refs.snoutLoader.$el.getElementById('snout-fill').style.fill = 'url("#gradient-1")';
                    self.$refs.snoutLoader.$el.classList.remove('loading');
                    this.item = null;
                    this.$refs.message.style.width = `0px`;
                }, 600);
            } else {
                self.loading = self.loading.filter(e => e.code !== evtCode);
                this.item %= this.loading.length;
            }
        });

        EventBus.$on('snout-loader-show', () => {
            self.$refs.snoutLoader.$el.classList.remove('bounce-out');
            self.$refs.snoutLoader.$el.classList.add('bounce-in');
            self.$refs.snoutLoaderContainer.classList.add('active');
        });

        EventBus.$on('snout-loader-hide', () => {
            self.$refs.snoutLoader.$el.classList.remove('bounce-in');
            self.$refs.snoutLoader.$el.classList.add('bounce-out');
            self.$refs.snoutLoaderContainer.classList.remove('active');
        });

        EventBus.$on('snout-loader-update-progress', progress => {
            self.progress = true;
            self.$refs.snoutLoader.$el.getElementById('snout-fill').style.fill = 'url("#gradient-3")';
            self.$refs.snoutLoader.$el.getElementById('gradient-3').children[0].setAttribute('offset', 1 - progress);
            self.$refs.snoutLoader.$el.getElementById('gradient-3').children[1].setAttribute('offset', 1 - progress);
        });

        EventBus.$on('snout-loader-finish-progress', () => {
            self.progress = false;
            self.$refs.snoutLoader.$el.getElementById('snout-fill').style.fill = 'url("#gradient-1")';
        });
    }
};
</script>

<style lang="scss" scoped>
    .snout-loader {
        &.active {
            opacity: 1;
        }
        opacity: 0;
        text-align: right;
        .message {
            color: white;
            background: $primary;
            display: inline-block;
            padding: 2px 0px;
            margin-right: 5px;
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            vertical-align: middle;
            // border: 1px solid #ddd;
            border-radius: 6px;
            transition: all .2s linear;
            white-space: nowrap;
            width: 0px;
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
