import Vue from 'vue';

let props = null;

const resizeTable = () => {
    props.el.style.maxHeight = `${Math.max(200, window.innerHeight - props.offset)}px`;
};

const DynamicHeight = {
    inserted(el, binding) {
        props = {};
        if (binding.value.innerSelector)
            props.el = el.querySelector(binding.value.innerSelector);
        else
            props.el = el;

        props.offset = binding.value.heightOffset || 0;
        resizeTable();
        window.addEventListener('resize', resizeTable, false);
    },
    unbind() {
        window.removeEventListener('resize', resizeTable, false);
    }
};

export default {
    DynamicHeight
};

Vue.directive('dynamic-height', DynamicHeight);
