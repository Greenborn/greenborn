import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiService } from 'src/services/api.service';
import { ConfigService } from 'src/services/config/config.service';

@Injectable({
  providedIn: 'root'
})
export class BussinessServiceService extends ApiService<any>{

  constructor( http: HttpClient,
    config: ConfigService) {
      super('public-bussiness-service', http, config)
     }
    
    get template(): any {
        return {
            
        }
    }
}