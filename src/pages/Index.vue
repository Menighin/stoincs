<template>
    <q-page class="flex flex-center page-index">
        <img alt="Quasar logo" src="~assets/snout.svg" v-show="false">
        <div class="index-logo-container active" ref="indexLogoContainer">
            <inline-svg
                ref="indexLogo"
                src="img/snout.svg"
                fill="black"
                id="logo-svg"
                :style="`transform: scale(${logoScale})`"
                aria-label="Porquinho Digital Logo"
            ></inline-svg>
        </div>
        <div class="about" v-if="about != null">
            <ul>
                <li>Version: <strong>{{ about.version }}</strong></li>
                <li>Build date: <strong>{{ about.buildDate }}</strong></li>
                <li>Build Machine: <strong>{{ about.machine }}</strong></li>
            </ul>
        </div>

        <q-dialog v-model="intro" persistent>
            <div style="width: 800px; position: relative">
                <q-btn icon="close" flat round dense v-close-popup @click="closeIntro" style="position: absolute; right: 5px; top: 5px; z-index: 99999999" />
                <q-carousel
                    transition-prev="slide-right"
                    transition-next="slide-left"
                    swipeable
                    animated
                    v-model="slide"
                    control-color="primary"
                    navigation
                    padding
                    arrows
                    height="400px"
                    class="bg-white shadow-1 rounded-borders"
                >
                    <q-carousel-slide :name="1" class="column no-wrap flex-center">
                        <inline-svg
                            src="img/snout.svg"
                            fill="black"
                            style="transform: scale(1)"
                            aria-label="Porquinho Digital Logo"
                        ></inline-svg>
                        <div class="q-mt-md text-center">
                            Bem-vindo ao <strong>Porquinho Digital</strong>!
                        </div>
                    </q-carousel-slide>
                    <q-carousel-slide :name="3" class="column no-wrap flex-center">
                        <q-icon name="eva-code" color="primary" size="72px"></q-icon>
                        <div class="q-mt-md text-center">
                            O <strong>Porquinho Digital</strong> é um projeto de código aberto. Sinta-se convidado a contribuir no nosso <a href="http://www.github.com/Menighin/porquinho-digital" target="_blank">GitHub</a>, seja com código, idéias ou dúvidas!
                        </div>
                    </q-carousel-slide>
                    <q-carousel-slide :name="4" class="column no-wrap flex-center">
                        <q-icon name="eva-file-text-outline" color="primary" size="72px"></q-icon>
                        <div class="q-mt-md text-center">
                            No <strong>Porquinho Digital</strong> você é dono dos seus dados. Eles ficam salvos localmente no seu computador!
                        </div>
                    </q-carousel-slide>
                    <q-carousel-slide :name="5" class="column no-wrap flex-center">
                        <q-icon name="eva-google" color="primary" size="72px"></q-icon>
                        <div class="q-mt-md text-center">
                            Você pode realizar o login na sua conta do Google e sincronizar os seus dados entre dispositivos.
                        </div>
                    </q-carousel-slide>
                    <q-carousel-slide :name="6" class="column no-wrap flex-center">
                        <q-icon name="eva-settings-2-outline" color="primary" size="72px"></q-icon>
                        <div class="q-mt-md text-center">
                            Para iniciar o acompanhamento dos seus investimentos, acesse a página de <strong>Configurações</strong> no menu lateral e configure os dados da sua conta no CEI e da Alpha Vantage.
                        </div>
                    </q-carousel-slide>
                    <q-carousel-slide :name="7" class="column no-wrap flex-center">
                        <inline-svg
                            src="img/snout.svg"
                            fill="black"
                            style="transform: scale(1)"
                            aria-label="Porquinho Digital Logo"
                        ></inline-svg>
                        <div class="q-mt-md text-center">
                            <h5 style="padding: 0; margin: 0"><strong>Bons investimentos!</strong></h5>
                        </div>
                    </q-carousel-slide>
                </q-carousel>
            </div>
        </q-dialog>

    </q-page>
</template>

<script>
import InlineSvg from 'vue-inline-svg';
import EventBus from '../components/EventBus';
import { ipcRenderer } from 'electron';

export default {
    name: 'PageIndex',
    components: {
        InlineSvg
    },
    data() {
        return {
            intro: false,
            lorem: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Natus, ratione eum minus fuga, quasi dicta facilis corporis magnam, suscipit at quo nostrum!',
            slide: 1,
            logoScale: 2,
            about: null
        };
    },
    methods: {
        closeIntro() {
            localStorage.setItem('intro', true);
        },
        snoutProgress(progress) {
            this.$refs.indexLogo.$el.getElementById('snout-fill').style.fill = 'url("#gradient-3")';
            this.$refs.indexLogo.$el.getElementById('gradient-3').children[0].setAttribute('offset', 1 - progress);
            this.$refs.indexLogo.$el.getElementById('gradient-3').children[1].setAttribute('offset', 1 - progress);
        },
        finishDownload() {
            this.$refs.indexLogo.$el.getElementById('snout-fill').style.fill = 'url("#gradient-1")';
        }
    },
    mounted() {
        if (this.$route.query.snoutState === 'hidden') {
            this.logoScale = 0;
            setTimeout(() => {
                this.$refs.indexLogo.$el.classList.add('bounce-in');
                setTimeout(() => { this.logoScale = 2 }, 700);
            }, 700);
        }

        if (!localStorage.getItem('intro'))
            this.intro = true;

        EventBus.$on('snout-loader-update-progress', this.snoutProgress);
        EventBus.$on('snout-loader-finish-progress', this.finishDownload);

        ipcRenderer.on('about/get', (event, response) => {
            this.about = response.data;
        });
        ipcRenderer.send('about/get');
    },
    beforeDestroy() {
        EventBus.$off('snout-loader-update-progress', this.snoutProgress);
        EventBus.$off('snout-loader-finish-progress', this.finishDownload);
    }
};
</script>

<style lang="scss">

    .page-index {
        a {
            color: $primary;
            text-decoration: none;
            font-weight: bold;
        }

        .index-logo-container {
            opacity: 0;
            &.active {
                opacity: 1;
            }

            #logo-svg {
                transition: all .5ms;
            }
        }

        .about {
            position: fixed;
            bottom: 10px;
            right: 25px;
            color: #888;
            font-size: 10px;
            text-align: right;
            ul {
                list-style: none;
            }
        }

        .bounce-out {
            animation: bounce-out .7s ease-in forwards;
        }

        .bounce-in {
            animation: bounce-in .7s ease-out forwards;
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

        @keyframes bounce-in {
            20% {
                transform: scale(0);
            }

            80% {
                transform: scale(2.5);
            }

            100% {
                transform: scale(2);
            }
        }
    }
</style>
