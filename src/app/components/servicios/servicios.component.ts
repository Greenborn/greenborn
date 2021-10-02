import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss'],
})
export class ServiciosComponent implements OnInit {

  public listado_servicios:any = [
    {
      id:0, 
      t:"Desarrollo de APP's Moviles", 
      d:"Programamos la APP que necesita, para luego poder exportarla a plataformas Android e IOs, utilizamos Frameworks hibridos como Ionic y React Native.",
      i:"assets/img/icon1.svg"
    },
    {
      id:10, 
      t:"Web Scraping", 
      d:"Descargamos información de sitios públicos de su elección para que Ud. pueda disponer de dicha información ya sea en formatos .CSV, Hoja de Cálculo,  Base de datos u otros a determinar.",
      i:"assets/img/icon2.svg"
    },
    {
      id:30, 
      t:"Migración Web", 
      d:"Migramos el contenido de su actual página web, sin importar en que CMS esté desarrollada o otro CMS de su elección, nueva APP Movil o de Escritorio.",
      i:"assets/img/icon3.svg"
    },
    {
      id:40, 
      t:"Solución de Errores", 
      d:"Resolvemos aquellos errores que pudieran estar presentes en el código de su APP o que se deban a defectos de configuración de su servidor.",
      i:"assets/img/icon4.svg"
    }
  ];

  constructor() { }

  ngOnInit() {}

}
