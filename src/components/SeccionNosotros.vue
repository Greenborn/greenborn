<template>
    <div class="row h-100vh seccion justify-content-center align-items-center" id="seccion-lema">
        <div class="col text-center text-cont">
            
            <p class="text-h-3">
                Una aplicación nace de una <b class="text-res-1">idea</b><br>
                al principio <b class="text-res-1">"pequeña"</b><br>
                que con <b class="text-res-1">Trabajo</b> <br>
                y <b class="text-res-1">ambición</b> crecerá <br>
                para alcanzar todo su <b class="text-res-1">potencial</b>
            </p>

        </div>
    </div>
</template>

<script setup>
</script>

<style>
.text-h-3{
    font-size: 4rem;
    font-family: "BelgianoSerif";
    color: #000;
}

.text-res-1{
    text-transform: uppercase;
    transition-duration: .5s;
    color: rgb(10, 51, 10);
}

.text-res-1:hover{
    font-size: 5rem;
}

@media (max-width: 500px) {
    .text-h-3{
        font-size: 7dvw;
    }

    .text-res-1:hover{
        font-size: 9dvw;
    }

    .text-cont{
        padding: 3rem;
    }
}
</style>