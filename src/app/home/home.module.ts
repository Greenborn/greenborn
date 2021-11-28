import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';

import { FullHeaderComponent } from 'src/app/components/full-header/full-header.component';
import { ServiciosComponent } from '../components/servicios/servicios.component';
import { TecnologiasComponent } from '../components/tecnologias/tecnologias.component';
import { ContactoComponent } from '../components/contacto/contacto.component';
import { SeparadorComponent } from '../components/separador/separador.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule
  ],
  declarations: [HomePage, FullHeaderComponent, ServiciosComponent, SeparadorComponent, TecnologiasComponent, ContactoComponent]
})
export class HomePageModule {}
