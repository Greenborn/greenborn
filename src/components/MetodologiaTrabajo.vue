<template>
    <div class="row h-100vh seccion " id="seccion-metodologia">
        <div class="col">

            <div class="row h-100vh justify-content-center mt-3">
                <div class="col-12 col-sm-8 col-md-6 col-lg-4">

                    <div id="carouselExampleIndicators" class="carousel slide" data-ride="carousel">
                        <ol class="carousel-indicators">
                            <li data-target="#carouselExampleIndicators" data-slide-to="0" class="active"></li>
                            <li data-target="#carouselExampleIndicators" data-slide-to="1"></li>
                            <li data-target="#carouselExampleIndicators" data-slide-to="2"></li>
                            <li data-target="#carouselExampleIndicators" data-slide-to="3"></li>
                            <li data-target="#carouselExampleIndicators" data-slide-to="4"></li>
                        </ol>
                        <div class="carousel-inner">
                            <div class="carousel-item active">
                                <img class="d-block w-100" :src="Reunion1"
                                    alt="Entrevista">
                                <div class="carousel-caption d-none d-md-block">
                                    <h5>Partimos de una entrevista para relevar la necesidad y comenzar a desarrollar la
                                        idea.</h5>
                                </div>
                            </div>
                            <div class="carousel-item">
                                <img class="d-block w-100" :src="Notas3"
                                    alt="Presupuesto">
                                <div class="carousel-caption d-none d-md-block">
                                    <h5>A partir del relevamiento presupuestamos.</h5>
                                </div>
                            </div>
                            <div class="carousel-item">
                                <img class="d-block w-100" :src="Notas4"
                                    alt="Creación de Entorno de Pruebas">
                                <div class="carousel-caption d-none d-md-block">
                                    <h5>Montamos un sitio de pruebas que mantendremos actualizado periodicamente.</h5>
                                </div>
                            </div>

                            <div class="carousel-item">
                                <img class="d-block w-100" :src="Notas1"
                                    alt="Desarrollo">
                                <div class="carousel-caption d-none d-md-block">
                                    <h5>Definimos el Producto Mínimo Viable, el cual será la base que iremos expandiendo.
                                        <br>
                                        Definiremos un cronograma de reuniones donde coordinar los avances
                                    </h5>
                                </div>
                            </div>

                            <div class="carousel-item">
                                <img class="d-block w-100" :src="Compu2"
                                    alt="Implementación">
                                <div class="carousel-caption d-none d-md-block">
                                    <h5>Definiremos un calendario de objetivos claros, requiriendo al pago al
                                        cumplimentarlos.</h5>
                                </div>
                            </div>
                        </div>
                    </div>
                    <a class="carousel-control-prev" href="#carouselExampleIndicators" role="button" data-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                        <span class="sr-only">Anterior</span>
                    </a>
                    <a class="carousel-control-next" href="#carouselExampleIndicators" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Siguiente</span>
                    </a>
                </div>

            </div>
        </div>

    </div>
</template>

<script setup>
import Reunion1 from "../assets/img/reunion1.jpeg"
import Notas4 from "../assets/img/notas4.jpeg"
import Notas3 from "../assets/img/notas3.jpeg"
import Notas1 from "../assets/img/notas1.jpeg"
import Compu2 from "../assets/img/compu2.jpeg"
</script>

<style>
.text-metod-1 {
    font-size: 2rem;
}

.carousel-caption{
    background-color: rgba(0, 0, 0, 0.9);
}
</style>