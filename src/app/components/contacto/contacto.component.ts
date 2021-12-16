import { Component, OnInit } from '@angular/core';
import { BootstrapFormRequired } from 'src/app/modules/AppUIUtils/components/bootstrap-form/bootstrap-form-validators';

import { BootstrapFormConfig, ButtonBootstrapFormConfig, FieldBootstrapFormConfig } from 'src/app/modules/AppUIUtils/components/bootstrap-form/model/bootstrap-form-config';

import { AppUIUtilsService }   from 'src/app/modules/AppUIUtils/services/app.ui.utils.service';
import { ContactoForm } from './models/contacto.form';
import { ContactTypeService } from './services/contact.type.service';
import { ContactoService } from './services/contacto.service';

@Component({
  selector: 'app-contacto',
  templateUrl: './contacto.component.html',
  styleUrls: ['./contacto.component.scss'],
})
export class ContactoComponent implements OnInit {

  public formConfig:BootstrapFormConfig = new BootstrapFormConfig();

  public contactModel:ContactoForm = new ContactoForm();

  private formSubmit:any          = null;
  private formIsValidatedSJ:any;
  private submitBtn:ButtonBootstrapFormConfig;

  constructor(
    private appUIUtilsService:  AppUIUtilsService,
    private contactoService:    ContactoService,
    private contactTypeService: ContactTypeService
  ) { }

  ngOnInit() {
    this.setFormConfig();
  }

  sendMessage(){
    if (this.contactModel.name == ''){
      this.appUIUtilsService.showMessage("Se debe ingresar un Nombre.");
      return;
    }

    if (this.contactModel.message == ''){
      this.appUIUtilsService.showMessage("Se debe ingresar un Mensaje.");
      return;
    }

    if (this.contactModel.email == '' && this.contactModel.tel == ''){
      this.appUIUtilsService.showMessage("Se debe ingresar un Email o un Télefono.");
      return;
    }

    this.appUIUtilsService.presentLoading();
    this.contactoService.post(this.contactModel).subscribe(
      ok => {
        this.appUIUtilsService.dismissLoading();
        this.appUIUtilsService.showMessage("Mensaje enviado, a la brevedad será contactado.");
      },
      err => {
        this.appUIUtilsService.dismissLoading();
        this.appUIUtilsService.showMessage("Limite de mensajes superado, intente luego.");
      }
    );
  }

  setFormConfig(){
    //CONFIGURACION INICIAL DEL FORMULARIO
    /*this.formConfig.clearFields();
    this.formConfig.setTitle( '' );
    this.formConfig.model = this.contactModel;

    this.formConfig.AddElement( new FieldBootstrapFormConfig(
      { title:'Nombre:', field: 'name', type: 'text','extraClass':'col-auto',
        validator: new BootstrapFormRequired()
      } ) );

    this.formConfig.AddElement( new FieldBootstrapFormConfig(
      { title:'Apellido:', field: 'name', type: 'text','extraClass':'col-auto',
      } ) );

    this.formConfig.AddElement( new FieldBootstrapFormConfig(
      { title:'Contacto:', field: 'contact_type', type: 'select',
          validator: new BootstrapFormRequired(),'extraClass':'col-auto',
          originDataSubject:this.contactTypeService.dataForSelectKeysSubj, provider: this.contactTypeService, getDataFunction:'getListadoKeysSelect'
      } ) );

    this.formConfig.AddElement( new FieldBootstrapFormConfig(
      { title:'Cuenta:', field: 'name', type: 'text','extraClass':'col-auto',
      } ) );

    this.formConfig.AddElement( new FieldBootstrapFormConfig(
      { title:'Email:', field: 'email', type: 'text','extraClass':'col-auto',
      } ) );

    this.submitBtn = new ButtonBootstrapFormConfig( { title:'Aplicar', type: 'button' } );
    this.formConfig.AddElement( this.submitBtn );

    //EVENTOS DEL FORMULARIO
    //BOTON enviar mensaje
    this.formSubmit = this.submitBtn.onClick.subscribe({  next: ( params: any ) => {
      this.formConfig.validateForm.next();
    } });

    //subscripción a subject de validación de formulario
    this.formIsValidatedSJ = this.formConfig.isValidated.subscribe({  next: ( params: any ) => {
      if ( params.success == true ){
        //Esta todo OK, se puede hacer peticiòn para consultar datos
        this.appUIUtilsService.presentLoading();
      } else {
        this.appUIUtilsService.showMessage( this.appUIUtilsService.getMessageFErrors( params.errors ) );
      }
  } });
  */
  }

}
