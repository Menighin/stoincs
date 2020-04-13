import EventBus from '../components/EventBus';

export default {
    install(Vue, options) {
        Vue.prototype.$snout = {
            start(evt) {
                EventBus.$emit('snout-loader-start', evt);
            },
            finish(evtCode) {
                EventBus.$emit('snout-loader-finish', evtCode);
            }
        };
    }
};
