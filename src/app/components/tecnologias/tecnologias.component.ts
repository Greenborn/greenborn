import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tecnologias',
  templateUrl: './tecnologias.component.html',
  styleUrls: ['./tecnologias.component.scss'],
})
export class TecnologiasComponent implements OnInit {

  public listado_tecnologias_leng:any = [
    {
      id:0, 
      t:"PHP", 
      i:"assets/img/php.svg"
    },
    {
      id:10, 
      t:"HTML", 
      i:"assets/img/html.svg"
    },
    {
      id:30, 
      t:"JavaScript", 
      i:"assets/img/js.svg"
    },
    {
      id:40, 
      t:"TypeScript", 
      i:"assets/img/ts.svg"
    },
    {
      id:50, 
      t:"Python", 
      i:"assets/img/py.svg"
    },
    {
      id:60, 
      t:"Java", 
      i:"assets/img/java.svg"
    },
    {
      id:70, 
      t:"Django", 
      i:"assets/img/dj.svg"
    },
    {
      id:80, 
      t:"Maria DB", 
      i:"assets/img/mariadb.svg"
    },
    {
      id:90, 
      t:"WordPress", 
      i:"assets/img/wp.svg"
    }
  ];

  constructor() { }

  ngOnInit() {}

}
