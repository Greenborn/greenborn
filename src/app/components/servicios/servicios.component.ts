import { Component, OnInit } from '@angular/core';
import { BussinessServiceService } from './services/bussiness.service.service';

@Component({
  selector: 'app-servicios',
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.scss'],
})
export class ServiciosComponent implements OnInit {

  public listado_servicios:any = [
  ];

  constructor(
    private bussinessServiceService: BussinessServiceService
  ) { }

  ngOnInit() {
    this.bussinessServiceService.getAll().subscribe(
      ok => {
        this.listado_servicios = ok;
      },
      err => {}
    );
  }

}
