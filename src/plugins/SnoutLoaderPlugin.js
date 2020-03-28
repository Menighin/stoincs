import EventBus from '../components/EventBus';

export default {
    install(Vue, options) {
        Vue.prototype.$snout = {
            start(evtCode) {
                EventBus.$emit('snout-loader-start', evtCode);
            },
            finish(evtCode) {
                EventBus.$emit('snout-loader-end', evtCode);
            }
        };
    }
};
