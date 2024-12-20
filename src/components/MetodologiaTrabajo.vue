<template>
    <div class="row h-100vh seccion " id="seccion-metodologia">
        <div class="col">

            <div class="row h-100vh justify-content-center mt-3">
                <div class="col-12 col-sm-8 col-md-6">

                    <div class="row row-cmp">
                        <div class="col-12">
                            <div class="row">
                                <div class="col-auto"><div class="circ-blend"><div class="circ-met circ-col-1">1</div></div></div>
                            </div>
                        </div>

                        <div class="col-12">
                            <div class="row">
                                <div class="col">
                                    <div class="des-tit">Entrevista Inicial</div>
                                </div>
                            </div>
                            <div class="des-cnt">
                                Nos entrevistaremos con Ud. para clarificar las necesidades, relevar requerimientos y 
                                dimensionar el alcance del proyecto. 
                            </div>
                        </div>
                    </div>

                    <div class="row row-cmp">
                        <div class="col-12">
                            <div class="row">
                                <div class="col-auto"><div class="circ-blend"><div class="circ-met circ-col-2">2</div></div></div>
                            </div>
                        </div>

                        <div class="col-12">
                            <div class="row">
                                <div class="col">
                                    <div class="des-tit">Propuesta</div>
                                </div>
                            </div>
                            <div class="des-cnt">
                                A partir del relavamiento de la Entrevista, nos enfocamos en la creación de una
                                propuesta de desarrollo, indicando las tecnologías a utilizar, así como su diseño
                                y arquitectura.
                            </div>
                        </div>
                    </div>

                    <div class="row row-cmp">
                        <div class="col-12">
                            <div class="row">
                                <div class="col-auto"><div class="circ-blend"><div class="circ-met circ-col-3">3</div></div></div>
                            </div>
                        </div>


                        <div class="col-12">
                            <div class="row">
                                <div class="col">
                                    <div class="des-tit">Preparación</div>
                                </div>
                            </div>
                            <div class="des-cnt">
                                Montamos un sitio de pruebas que mantendremos actualizado periodicamente.<br>
                                En donde podrá constatar el avance del proceso así como da la oportunidad
                                de identificar correcciones.

                                Definimos el Producto Mínimo Viable, el cual será la base que iremos expandiendo.
                                
                                Definiremos un cronograma de reuniones donde coordinar los avances y un cronograma
                                de objetivos de entregas.<br>
                            </div>
                        </div>
                    </div>

                    <div class="row row-cmp">
                        <div class="col-12">
                            <div class="row">
                                <div class="col-auto"><div class="circ-blend"><div class="circ-met circ-col-4">4</div></div></div>
                            </div>
                        </div>


                        <div class="col-12">
                            <div class="row">
                                <div class="col">
                                    <div class="des-tit">Desarrollo</div>
                                </div>
                            </div>
                            <div class="des-cnt">
                                Damos inicio al proceso de implementación de diseños y arquitecturas propuestos. <br>
                                Mantenemos actualizado el sitio de pruebas en cada avance. <br>
                                Nos mantendremos en contacto duranto todo el proceso, con el nivel el feedback que Ud. considere.<br>
                            </div>
                        </div>
                    </div>

                    <div class="row row-cmp">
                        <div class="col-12">
                            <div class="row">
                                <div class="col-auto"><div class="circ-blend"><div class="circ-met circ-col-5">5</div></div></div>
                            </div>
                        </div>


                        <div class="col-12">
                            <div class="row">
                                <div class="col">
                                    <div class="des-tit">implementación</div>
                                </div>
                            </div>
                            <div class="des-cnt">
                                Con cada objetivo complido y validado, requerimos el pago del mismo.<br>
                                Realizamos la instalación del sistema en su ubicación definitiva.
                            </div>
                        </div>
                    </div>

                    <div class="row row-cmp">
                        <div class="col-12">
                            <div class="row">
                                <div class="col-auto"><div class="circ-blend"><div class="circ-met circ-col-6">6</div></div></div>
                            </div>
                        </div>


                        <div class="col-12">
                            <div class="row">
                                <div class="col">
                                    <div class="des-tit">Soporte</div>
                                </div>
                            </div>
                            <div class="des-cnt">
                                Luego de la implementación pueden surgir dudas sobre el uso, 
                                la necesidad de nuevas funcionalidades o la corrección de bugs.<br>
                                Por lo que brindamos soporte post-venta.
                            </div>
                        </div>
                    </div>

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

<style scss scoped>
.row-cmp{ 
    margin-top: 5rem;
    margin-bottom: 15rem;
}

.circ-col-1{
    background-color: #9c7711;
    color: #fff;
}

.circ-col-2{
    background-color: #285291;
    color: #fff;
}

.circ-col-3{
    background-color: #64257c;
    color: #fff;
}

.circ-col-4{
    background-color: #1a5f8d;
    color: #fff;
}

.circ-col-5{
    background-color: #4f7e53;
    color: #fff;
}

.circ-col-6{
    background-color: #793b3b;
    color: #fff;
}


.circ-blend, .circ-met{
    position: absolute;
    width: 15rem;
    height: 15rem;
    border-radius: 50%;
    transition-duration: 1s;
}

.circ-met{
    font-size: 6rem;
    text-align: center;
    vertical-align: middle;
    display: table-cell;
    z-index: 100;
}

.circ-blend:hover .circ-met{
    width: 20rem;
    height: 20rem;
    font-size: 8rem;
}

.circ-blend:hover {
    width: 20rem;
    height: 20rem;
}

.circ-blend{
    mix-blend-mode: difference;
    z-index: 500;
    background: #fff;
    top: -7rem;
    left: -3rem;
}

.des-cnt{
    font-size: 2rem;
    z-index: 300;
    position: relative;
}

.des-tit{
    font-size: 4rem;
    z-index: 300;
    position: relative;
}

.text-metod-1 {
    font-size: 2rem;
}

@media (max-width: 353px) {
    .des-cnt{
        font-size: 1rem;
    }

    .des-tit{
        font-size: 2rem;
    }
}
</style>