<template>

  <div class="container">
    <h2>Tabs in Vue.js:</h2>
    <br>

    <ul class="nav nav-tabs nav-justified">
      <li class="nav-item">
        <a class="nav-link" @click.prevent="setActive('home')" :class="{ active: isActive('home') }" href="#home">Home</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" @click.prevent="setActive('profile')" :class="{ active: isActive('profile') }" href="#profile">Profile</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" @click.prevent="setActive('contact')" :class="{ active: isActive('contact') }" href="#contact">Contact</a>
      </li>
    </ul>
    <div class="tab-content py-3" id="myTabContent">
      <div class="tab-pane fade" :class="{ 'active show': isActive('home') }" id="home">
      <div class="hello">
        <h1>{{ msg }}</h1>
        <h2>Servidor de minecraft, IP: greenborn.com.ar</h2>
        <h3>Por servicio de configuración de servidores Spigot, Paper o Bukkit, puede contactarse conmigo por medio de mi correo electrónico: lucho.2012.tandil[at]gmail.com</h3>
      </div>
      </div>
      <div class="tab-pane fade" :class="{ 'active show': isActive('profile') }" id="profile">Profile content</div>
      <div class="tab-pane fade" :class="{ 'active show': isActive('contact') }" id="contact">Contact content</div>
    </div>
  </div>

</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Bienvenidos a Greenborn.com.ar'
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
</style>
