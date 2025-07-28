<template>
<canvas width="500" height="200" id="canv" />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(()=>{
    const canvas = document.getElementById('canv');
    const ctx = canvas.getContext('2d');
    
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const cols = Math.floor(w / 25) + 1;
    const ypos = Array(cols).fill(0);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    setInterval(()=>{
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.fillStyle = 'rgba(0, 212, 170, 0.1)';
        ctx.font = '12pt monospace';
        
        ypos.forEach((y, ind) => {
            const text = String.fromCharCode(Math.random() * 128);
            const x = ind * 25;
            ctx.fillText(text, x, y);
            if (y > 100 + Math.random() * 10000) ypos[ind] = 0;
            else ypos[ind] = y + 25;
        });
    }, 100);

})
</script>

<style scoped>
#canv {
    top: 0;
    left: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    transform: rotate(-180deg);
    z-index: 1;
}
</style>