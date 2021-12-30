import { Component, OnInit } from '@angular/core';
import { TecnologiasService } from './services/tecnologias.service';

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
      e:"https://www.php.net/",
      i:"assets/img/php.svg"
    },
    {
      id:10, 
      t:"HTML", 
      e:"https://developer.mozilla.org/en-US/docs/Web/HTML",
      i:"assets/img/html.svg"
    },
    {
      id:15, 
      t:"Bootstrap", 
      e:"https://getbootstrap.com/",
      i:"assets/img/bootstrap.svg"
    },
    {
      id:30, 
      t:"JavaScript", 
      e:"https://developer.mozilla.org/en-US/docs/Learn/JavaScript/First_steps/What_is_JavaScript",
      i:"assets/img/js.svg"
    },
    {
      id:40, 
      t:"TypeScript", 
      e:"https://www.typescriptlang.org/",
      i:"assets/img/ts.svg"
    },
    {
      id:50, 
      t:"Python", 
      e:"https://www.python.org/",
      i:"assets/img/py.svg"
    },
    {
      id:60, 
      t:"Java", 
      e:"https://www.java.com",
      i:"assets/img/java.svg"
    },
    {
      id:70, 
      t:"Django", 
      e:"https://www.djangoproject.com/",
      i:"assets/img/dj.svg"
    },
    {
      id:80, 
      t:"Maria DB", 
      e:"https://mariadb.org/",
      i:"assets/img/mariadb.svg"
    },
    {
      id:90, 
      t:"WordPress", 
      e:"https://wordpress.com/",
      i:"assets/img/wp.svg"
    }
  ];

  constructor(
    private tecnologiasService: TecnologiasService
  ) { }

  ngOnInit() {
    this.tecnologiasService.getAll().subscribe(
      ok => {
        this.listado_tecnologias_leng = ok;
      },
      err => {}
    );
  }

}
