<template>

  <div class="container">
    <ul class="nav nav-tabs nav-justified">
      <li class="nav-item">
        <a class="nav-link" @click.prevent="setActive('home')" :class="{ active: isActive('home') }">Minecraft</a>
      </li>

    </ul>
    <div class="tab-content py-3" id="myTabContent">
      <div class="tab-pane fade" :class="{ 'active show': isActive('home') }" id="home">
        <h2>Servidor de minecraft, IP: greenborn.com.ar</h2>
        <h3>Por servicio de configuración de servidores Spigot, Paper o Bukkit, puede contactarse conmigo por medio de mi correo electrónico: lucho.2012.tandil[at]gmail.com</h3>
        <h3>Discord: <a href="https://discord.gg/4DdAtr6">https://discord.gg/4DdAtr6</a></h3>
      </div>
    </div>
  </div>

</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    this.activeItem = 'home'
    return {
      msg: 'Bienvenidos a Greenborn.com.ar'
    }
  },
  methods: {
    isActive (menuItem) {
      return this.activeItem === menuItem
    },
    setActive (menuItem) {
      this.activeItem = menuItem
    }
  }
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

body {
  padding: 20px 0;
}
</style>
