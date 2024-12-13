<template>
    <div>
        <span v-for="letra in text" :key="letra" @mousemove="onMouseMove">{{ letra }}</span>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['text'])

function onMouseMove( letra ){
    
}

onMounted(async ()=>{
    
})
</script>