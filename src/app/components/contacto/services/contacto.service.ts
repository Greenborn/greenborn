import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { ConfigService } from 'src/services/config/config.service';
import { ContactoForm } from '../models/contacto.form';

@Injectable({
  providedIn: 'root'
})
export class ContactoService extends ApiService<ContactoForm>{

  constructor( http: HttpClient,
    config: ConfigService) {
      super('contactoForm', http, config)
     }
    
    get template(): ContactoForm {
        return {
            name:'',
            surname:'',
            message:'',
            email:'',
            tel:'',
            datetime:null,
        }
    }
}