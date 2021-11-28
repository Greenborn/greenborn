import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss'],
})
export class ContactoComponent implements OnInit {

  public listado_contactos:any = [
    {
      id:0, 
      t:"Facebook", 
      i:"assets/img/facebook.svg"
    },
    {
      id:10, 
      t:"Instagram", 
      i:"assets/img/instagram.svg"
    },
    {
      id:30, 
      t:"Discord", 
      i:"assets/img/discord.svg"
    },
  ];

  constructor() { }

  ngOnInit() {}

}
