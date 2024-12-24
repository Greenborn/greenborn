<template>
  <div class="card-wrap"
      @mousemove="handleMouseMove"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      ref="card">
    <div class="card" :style="cardStyle()">
        <div class="card-bg" :style="cardBgStyle()"></div>
        <div class="card-info">
          <h1 slot="header">{{ data.name }}</h1>
          <p slot="content">{{ data.description }}</p>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps([ "data" ])

const width = ref(0)
const height =  ref(0)
const mouseX = ref(0)
const mouseY =  ref(0)
const mouseLeaveDelay = ref(null)
const card = ref()

onMounted(() => {
  width.value =  640//card.value.offsetWidth;
  height.value = 340//card.value.offsetHeight;
})

function mousePX() {
  return mouseX.value / width.value;
}

function mousePY() {
  return mouseY.value / height.value;
}

function cardBgStyle(){
  const tX = mousePX() * -40;
  const tY = mousePY() * -40;
  console.log(tX, tY)
  return {
    transform: `translateX(${tX}px) translateY(${tY}px)`,
    backgroundImage: `url(${props.data.img_src})`
  }
}

function cardStyle() {
  const rX = mousePX();
  const rY = mousePY();
  return {
    transform: `rotateY(${rX}deg) rotateX(${rY}deg)`,
  };
}

function handleMouseMove(e) {
  mouseX.value = e.pageX - card.value.offsetLeft - width.value/2;
  mouseY.value = e.pageY - card.value.offsetTop - height.value/2;
}

function handleMouseEnter() {
  clearTimeout(mouseLeaveDelay.value);
}

function handleMouseLeave() {
  mouseLeaveDelay.value = setTimeout(()=>{
    mouseX.value = 0;
    mouseY.value = 0;
  }, 1000);
}
</script>

<style lang="scss" scoped>
$hoverEasing: cubic-bezier(0.23, 1, 0.32, 1);
$returnEasing: cubic-bezier(0.445, 0.05, 0.55, 0.95);

.title {
  font-size: 24px;
  font-weight: 700;
  color: #5D4037;
  text-align: center;
}

p {
  line-height: 1.5em;
}

h1+p, p+p {
  margin-top: 10px;
}

.container {
  padding: 40px 80px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.card-wrap {
  margin: 10px;
  transform: perspective(800px);
  transform-style: preserve-3d;
  cursor: pointer;
  // background-color: #fff;
  
  &:hover {
    .card-info {
      transform: translateY(0);
    }
    .card-info p {
      opacity: 1;
    }
    .card-info, .card-info p {
      transition: 0.6s $hoverEasing;
    }
    .card-info:after {
      transition: 5s $hoverEasing;
      opacity: 1;
      transform: translateY(0);
    }
    .card-bg {
      transition: 
        0.6s $hoverEasing,
        opacity 5s $hoverEasing;
      opacity: 0.8;
    }
    .card {
      transition:
        0.6s $hoverEasing,
        box-shadow 2s $hoverEasing;
      box-shadow:
        rgba(white, 0.2) 0 0 40px 5px,
        rgba(white, 1) 0 0 0 1px,
        rgba(black, 0.66) 0 30px 60px 0,
        inset #333 0 0 0 5px,
        inset white 0 0 0 6px;
    }
  }
}

.card {
  position: relative;
  flex: 0 0 240px;
  //width: 240px;
  height: 320px;
  background-color: #333;
  overflow: hidden;
  border-radius: 10px;
  box-shadow:
    rgba(black, 0.66) 0 30px 60px 0,
    inset #333 0 0 0 5px,
    inset rgba(white, 0.5) 0 0 0 6px;
  transition: 1s $returnEasing;
}

.card-bg {
  opacity: 0.5;
  position: absolute;
  top: -20px; left: -20px;
  width: 100%;
  height: 100%;
  padding: 20px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  transition:
    1s $returnEasing,
    opacity 5s 1s $returnEasing;
  pointer-events: none;
}

.card-info {
  padding: 20px;
  position: absolute;
  bottom: 0;
  color: #fff;
  transform: translateY(40%);
  transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1);
  
  p {
    opacity: 0;
    text-shadow: rgba(black, 1) 0 2px 3px;
    transition: 0.6s 1.6s cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  
  * {
    position: relative;
    z-index: 1;
  }
  
  &:after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    background-image: linear-gradient(to bottom, transparent 0%, rgba(#000, 0.6) 100%);
    background-blend-mode: overlay;
    opacity: 0;
    transform: translateY(100%);
    transition: 5s 1s $returnEasing;
  }
}

.card-info h1 {
  font-family: "Playfair Display";
  font-size: 36px;
  font-weight: 700;
  text-shadow: rgba(black, 0.5) 0 10px 10px;
}
</style>