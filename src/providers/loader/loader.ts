import { Injectable } from '@angular/core';
import {LoadingController} from "ionic-angular";

/*
  This loader is common to all pages.
  Since it is a singleton it makes sure
  1. All page instances use the same loader
  2. No more than one loader can be open at the same time
*/
@Injectable()
export class LoaderProvider {

  loader: any;
  loaderOpen: boolean = false;

  private readonly useDialog = true;

  constructor(private loadingCtrl: LoadingController) {
    
  }

  showLoader() {
    if(this.useDialog){
      this.loader = this.loadingCtrl.create({
        spinner: 'crescent',
        content: '',
        cssClass: 'loader',
      });

      this.loader.present();
    }
    else{
      document.getElementById('global-center-loader').classList.add('show');
    }
    this.loaderOpen = true;
  }

  hideLoader() {
    if(this.loaderOpen) {
      if(this.useDialog){
        this.loader.dismiss();
      }
      else{
        document.getElementById('global-center-loader').classList.remove('show');
      }
      this.loaderOpen = false;
    }
  }

}
