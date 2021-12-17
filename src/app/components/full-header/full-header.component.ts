import { Component, OnInit } from '@angular/core';
import { AppUIUtilsService } from 'src/app/modules/AppUIUtils/services/app.ui.utils.service';

@Component({
  selector: 'app-full-header',
  templateUrl: './full-header.component.html',
  styleUrls: ['./full-header.component.scss'],
})
export class FullHeaderComponent implements OnInit {

  constructor(
    private appUIUtilsService: AppUIUtilsService
  ) { }

  ngOnInit() {}

  enConstruccion(){
    this.appUIUtilsService.showMessage('¡Sitio en construcción!');
  }
}
