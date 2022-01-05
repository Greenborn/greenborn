import { Component, OnInit } from '@angular/core';
import { TecnologiasService } from './services/tecnologias.service';

@Component({
  selector: 'app-tecnologias',
  templateUrl: './tecnologias.component.html',
  styleUrls: ['./tecnologias.component.scss'],
})
export class TecnologiasComponent implements OnInit {

  public listado_tecnologias_leng:any = [];

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
