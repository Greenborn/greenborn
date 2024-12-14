<template>
    <div class="card">
        <div class="card-body">

            <div class="row">

            <div class="col-sm-auto">
                <div class="row">
                <div class="col"></div>
                <div class="col mb-3"><img class="icon-f-img disable-select"
                    :src="'https://clientes.api.greenborn.com.ar/' + data.img_src" /></div>
                <div class="col"></div>
                </div>
            </div>

            <div class="col">
                <div class="row">
                <div class="col text-center">
                    <h3>{{ data.name }}</h3>
                </div>
                </div>

                <div class="row">
                <div class="col-12 text-justify">
                    <p>{{ data.description }}</p>
                </div>
                </div>
            </div>

            </div>

        </div>
    </div>
</template>

<script setup>

const props = defineProps([ "data" ])

</script>

<style scoped>
.icon-f-img{
    width:100%;
    height: auto;
}
</style>