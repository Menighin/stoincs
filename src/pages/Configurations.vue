<template>
  <q-page class="flex flex-center">
    <div class="column q-pa-md" style="width: 80%">
      <div class="row q-ma-sm justify-between items-center">
        <h5 class="q-ma-none">CEI</h5>
        <q-icon name="help" class="cursor-pointer" size="24px" color="info">
          <q-menu anchor="top right" self="bottom right" content-class="q-pa-sm">
            Usuário e senha do CEI utilizados para processar suas informações.
          </q-menu>
        </q-icon>
      </div>
      <q-input class="q-mx-sm" filled v-model="username" label="CPF" />
      <q-input class="q-ma-sm" filled v-model="password" label="Senha" :type="isPwd ? 'password' : 'text'">
        <template v-slot:append>
          <q-icon
            :name="isPwd ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="isPwd = !isPwd"
          />
        </template>
        </q-input>
        <div class="row q-px-sm justify-end">
          <q-btn color="primary">Salvar</q-btn>
        </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'PageConfigurations',
  data () {
    return {
      username: '',
      password: '',
      isPwd: true
    }
  }
}
</script>
