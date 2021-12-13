import { Component, OnInit } from '@angular/core';

import { AppUIUtilsService }   from 'src/app/modules/AppUIUtils/services/app.ui.utils.service';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss'],
})
export class ContactoComponent implements OnInit {

  constructor(
    private appUIUtilsService: AppUIUtilsService
  ) { }

  ngOnInit() {}

  sendMessage(){
    alert("hola");
    this.appUIUtilsService.presentLoading();
  }
}
