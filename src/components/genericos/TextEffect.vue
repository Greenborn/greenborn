<template>
    <div class="row">
        <div class="col">
            <span v-for="(letra, index) in text" :key="letra" 
                @mousemove="onMouseMove(index)" 
                @mouseleave="onMouseLeave(index)"
                class="text-effect">
                <span class="disable-select text-effect-char" :style="letras_style[index]">{{ letra }}</span></span>
        </div>
    </div>    
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps(['text'])

const config = ref({
    'animation_duration': 3
})

const letras_style = ref([])
const anim_frame = ref(0)

function onMouseMove( index ){
    if (anim_frame.value != 2) return
    letras_style.value[index]['color'] = 'green' 
    letras_style.value[index]['transform'] = 'scale(1,1.5)' 
}

function onMouseLeave( index ){
    if (anim_frame.value != 2) return
    letras_style.value[index]['color'] = 'white' 
    letras_style.value[index]['transform'] = 'scale(1,1)' 
}

onMounted(async ()=>{
    const cant_letras = props.text.length
    for (let i = 0; i < cant_letras; i++){
        const seg_char = config.value.animation_duration / cant_letras
        letras_style.value.push({
            'transition-duration': '1s',
            'transition-delay': seg_char * i + 's',
            'transform': 'scale(1,0)',
        })
        anim_frame.value = 0
    }
    
    setTimeout(() => {
        for (let i = 0; i < cant_letras; i++){
            letras_style.value[i]['transform'] = 'scale(1,1)'
        }
        anim_frame.value = 1
    },500)

    setTimeout(() => {
        for (let i = 0; i < cant_letras; i++){
            letras_style.value[i]['transition-delay'] = '0s'
        }
        anim_frame.value = 2
    },3000)

})
</script>

<style>
.text-effect{
    display: inline-block;
}

.text-effect-char{
    display: block;
}
</style>