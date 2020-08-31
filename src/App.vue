<template>
    <div id="q-app">
        <router-view />
    </div>
</template>

<script>

import DynamicHeight from './directives/DynamicHeight';

export default {
    name: 'App',
    directives: {
        DynamicHeight
    }
};
</script>
