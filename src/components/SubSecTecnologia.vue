<template>
    <div class="col-auto" >
        <a href="{{data.url}}" target="_blank"><img :src="'https://clientes.api.greenborn.com.ar/'+data.img_src" class="img-tecno"/></a>
    </div>
</template>

<script setup>

const props = defineProps([ "data" ])

</script>