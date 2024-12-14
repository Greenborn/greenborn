<template>
<div class="card">
    <div class="card-body">
        <div class="row">
            <div class="col text-center">
                <a :href="data.url" target="_blank">{{ data.titulo }}</a>
            </div>
        </div>
        
        <div class="row mt-3 disable-select">
            <div class="col" v-html="data.descripcion_organizacion">
            </div>
        </div>

        <div class="row disable-select">
            <div class="col">
                <p>
                    <b>Tecnologias Usadas:&nbsp;</b>
                    <span class="badge badge-pill ml-1  badge-info" 
                        v-for="(item_tec, index_tec) in data.tecnologias_usadas" :key="index_tec">{{ item_tec }}</span>
                </p>
            </div>
        </div>
        
    </div>
</div>
</template>

<script setup>

const props = defineProps([ "data" ])

</script>