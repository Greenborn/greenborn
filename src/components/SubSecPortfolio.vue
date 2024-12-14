<template>
<div class="card">
    <div class="card-body">
        {{ data.titulo }}
        {{ data.descripcion_organizacion }}
        {{ data.url }}
        {{ data.tecnologias_usadas }}
    </div>
</div>
</template>

<script setup>

const props = defineProps([ "data" ])

</script>