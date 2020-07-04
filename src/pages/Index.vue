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
                            No <strong>Porquinho Digital</strong> você é dono dos seus dados. Eles ficam salvos no seu computador e você pode sincronizá-los através do seu Google Drive.
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
                            Para iniciar o acompanhamento dos seus investimentos, acesse a página de <strong>Configurações</strong> no menu lateral e configure os dados da sua conta no CEI e no Alpha Vantage.
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

export default {
    name: 'PageIndex',
    components: {
        InlineSvg
    },
    data() {
        return {
            intro: false,
            lorem: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Natus, ratione eum minus fuga, quasi dicta facilis corporis magnam, suscipit at quo nostrum!',
            slide: 1
        };
    },
    methods: {
        closeIntro() {
            localStorage.setItem('intro', true);
        }
    },
    mounted() {
        if (!localStorage.getItem('intro'))
            this.intro = true;
    }
};
</script>

<style lang="scss">

    a {
        color: $primary;
        text-decoration: none;
        font-weight: bold;
    }

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
