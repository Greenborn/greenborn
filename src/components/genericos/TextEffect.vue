<template>
    <div>
        <span v-for="(letra, index) in text" :key="letra" 
            @mousemove="onMouseMove(index)" 
            @mouseleave="onMouseLeave(index)"
            :style="letras_style[index]" 
            class="text-effect">
            <span class="disable-select">{{ letra }}</span></span>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['text'])

const letras_style = ref([])

function onMouseMove( index ){
    letras_style.value[index]['color'] = 'green' 
}

function onMouseLeave( index ){
    letras_style.value[index]['color'] = 'white' 
}

onMounted(async ()=>{
    for (let i = 0; i < props.text.length; i++) 
        letras_style.value.push({
            'transition-duration': '1s',
        })
    
})
</script>

<style>
</style>