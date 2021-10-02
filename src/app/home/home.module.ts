import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TabsPageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';

import { FullHeaderComponent } from 'src/app/components/full-header/full-header.component';
import { ServiciosComponent } from '../components/servicios/servicios.component';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    TabsPageRoutingModule
  ],
  declarations: [HomePage, FullHeaderComponent, ServiciosComponent]
})
export class HomePageModule {}
