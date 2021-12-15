import { Component, OnInit } from '@angular/core';

import { AppUIUtilsService }   from 'src/app/modules/AppUIUtils/services/app.ui.utils.service';
import { ContactoForm } from './models/contacto.form';
import { ContactoService } from './services/contacto.service';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss'],
})
export class ContactoComponent implements OnInit {

  public contactModel:ContactoForm = new ContactoForm();

  constructor(
    private appUIUtilsService: AppUIUtilsService,
    private contactoService:   ContactoService
  ) { }

  ngOnInit() {}

  sendMessage(){
    this.appUIUtilsService.showMessage("Funcionalidad pendiente de implementación, en breve podrá usar el formulario de contacto");
  }
}
