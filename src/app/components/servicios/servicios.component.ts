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
    }
  ];

  constructor() { }

  ngOnInit() {}

}
