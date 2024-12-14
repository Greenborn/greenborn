<template>
<div class="menu-colapsed" >
    <div class="row justify-content-center">
        <div class="col-auto">

            <div class="row align-items-center menu-item" @click="abrirMenu()">
                <div class="col">
                    <div class="menu-label">{{ enlace_activo.label }}</div>
                </div>
                <div class="col-auto">
                    <div class="menu-check" :class="{ 'menu-check-active': enlace_activo.active }"></div>
                </div>
            </div>

        </div>
    </div>
</div>

<div class="menu-flotante" :class="{ 'menu-oculto':!desplegado }">
    <div class="row h-100vh justify-content-center align-items-center">
        <div class="col-auto">
            <div class="menu-linea-vert"></div>

            <div class="row align-items-center menu-item" v-for="enlace in enlaces" :key="enlace" @click="clickEnlace(enlace)">
                <div class="col text-right">
                    <div class="menu-label">{{ enlace.label }}</div>
                </div>
                <div class="col-auto">
                    <div class="menu-check" :class="{ 'menu-check-active': enlace.active }"></div>
                </div>
            </div>

        </div>
    </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const desplegado = ref(false)

const enlaces = ref([
    { label: 'Inicio', active: true, section_id:"seccion-inicio",  element: null },
    { label: 'Lema', active: false, section_id:"seccion-lema",  element: null },
    { label: 'Servicios', active: false, section_id:"seccion-servicios",  element: null  },
    { label: 'Metodología', active: false, section_id:"seccion-metodologia", element: null  },
    { label: 'Portfolio', active: false, section_id:"seccion-portfolio",  element: null  },
    { label: 'Tecnologías', active: false, section_id:"seccion-tecnologias",  element: null  },
])
const enlace_activo = ref(enlaces.value[0])

function abrirMenu(){
    desplegado.value = true
}

function clickEnlace( enlace ){
    desplegado.value = false
    for (let i=0; i < enlaces.value.length; i++){
        enlaces.value[i].active = false
    }
    enlace.active = true
    enlace_activo.value = enlace
    enlace.element.scrollIntoView({ behavior: 'smooth' })
}

onMounted(async ()=>{
    for (let i=0; i < enlaces.value.length; i++){
        const elemento = document.getElementById(enlaces.value[i].section_id)
        enlaces.value[i].element = elemento
    }

    window.addEventListener('scroll', function(e) {
        for (let i=0; i < enlaces.value.length; i++){
            if (window.scrollY > enlaces.value[i].element.offsetTop - 100){
                enlaces.value[i].active = true
                enlace_activo.value = enlaces.value[i]
            }else{
                enlaces.value[i].active = false
            }
        }
    })
})
</script>

<style scoped>
.menu-flotante, .menu-colapsed{
    transition-duration: .3s;
}

.menu-flotante{
    position: fixed;
    z-index: 3000;
    top: 0px;
    height: 100vh;
    width: 100vw;
    right: .5rem;
    padding-left: 2rem;
    padding-right: 2rem;
    background: rgb(1,29,0);
    background: linear-gradient(90deg, rgba(1,29,0,0) 0%, rgba(1,29,0,0) 27%, rgba(0,0,0,1) 31%, rgba(0,0,0,1) 68%, rgba(1,29,0,0) 72%, rgba(1,29,0,0) 100%);
}

.menu-colapsed{
    position: fixed;
    z-index: 3000;
    top: 0px;
    width: 100vw;
    padding: 1rem;
    background-color: #000;
    left: 0px;
}

.menu-oculto{
    transform: scale(1,0);
}

.menu-check{
    width: 2rem;
    height: 2rem;
    border: .2rem solid #fff;
    transform: rotate(45deg);
    margin: 1rem;
    background-color: #000;
    transition-duration: 1s;
}

.menu-check-active{
    background-color: #fff;
}

.menu-label{
    color: #fff;
    font-weight: bold;
    font-size: 2rem;
    padding: 1rem;
}

.menu-item:hover .menu-check{
    background-color: rgb(0, 255, 42);
}

.menu-item:click .menu-check{
    background-color: green;
}

.menu-linea-vert{
    position: absolute;
    height: 100%;
    border: .15rem solid #fff;
    border-radius: .15rem;
    right: 2.825rem;
}

@media (max-width: 500px) {
    .menu-flotante{
        background: #000;
    }
}
</style>