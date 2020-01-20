<template>
  <q-drawer
    v-model="drawerOpen"
    show-if-above
    bordered
    side="right"
    content-class="bg-grey-2">

    <h1>Right area</h1>
  </q-drawer>
</template>

<script>
export default {
  props: {
    drawerOpen: {
      type: Boolean,
      required: true
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
