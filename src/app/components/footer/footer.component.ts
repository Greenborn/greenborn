import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {

  public anio:number = 0;
  public listado_contactos:any = [
    {
      id:0, 
      t:"Facebook", 
      i:"assets/img/facebook.svg",
      e:"https://www.facebook.com/Greenborn-100550959124104"
    },
    {
      id:10, 
      t:"Instagram", 
      i:"assets/img/instagram.svg",
      e:"https://www.instagram.com/greenborn_soft/"
    },
    {
      id:30, 
      t:"Discord", 
      i:"assets/img/discord.svg",
      e:"https://discord.gg/ZH36cEh2"
    },
    {
      id:40, 
      t:"Linkedin", 
      i:"assets/img/linkedin.svg",
      e:"https://www.linkedin.com/company/greenborn"
    },
  ];

  constructor() { }

  ngOnInit() {
    this.anio = Number(new Date().getFullYear());
  }

}
