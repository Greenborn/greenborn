import { Component, OnInit, Input } from '@angular/core';

import { AppUIUtilsService }   from '../../services/app.ui.utils.service';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent implements OnInit {

  constructor(
    private appUIUtilsService:  AppUIUtilsService
  ) { }

  ngOnInit() {
  }

  hasPresent(){
    return this.appUIUtilsService.loadingPresent;
  }
}
