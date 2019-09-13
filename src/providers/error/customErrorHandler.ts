import {AlertController, Platform, ToastController} from "ionic-angular";
import {LoaderProvider} from "../loader/loader";
import {ErrorHandler, Injectable} from "@angular/core";
import {SplashScreen} from "@ionic-native/splash-screen";
import {Network} from "@ionic-native/network";



@Injectable()
export class CustomErrorHandler implements ErrorHandler {

  private isConnectionLostAlertDisplayed: boolean = false;
  private isServerConnectionFailedAlertDisplayed: boolean = false;
  private initLocation: string;
  private toaster = null;

  constructor(private loader: LoaderProvider,
              private toastCtrl: ToastController,
              private alertCtrl: AlertController,
              private splashScreen: SplashScreen,
              private network: Network,
              private platform: Platform) {
    this.initLocation = window.location.href;
  }

  handleError(err: any): void {
    console.log(err);
    this.platform.ready().then(() => {
      this.loader.hideLoader();
      this.splashScreen.hide();
      this.presentError(err);
    });
  }

  presentError(err = undefined) {

    let b = false;
    if (b && this.network.type === 'none') {
      if (!this.isConnectionLostAlertDisplayed) {
        this.isConnectionLostAlertDisplayed = true;
        let alert = this.alertCtrl.create({
          title: 'Connection lost!',
          message: 'It seems you don\'t have an internet connection. Try to connect and click restart',
          enableBackdropDismiss: false,
          buttons: [
            {
              text: 'Restart',
              handler: () => {
                this.loader.showLoader();
                this.restartApplication();
              }
            }
          ]
        });
        alert.present();
      }
    } else if (b && err && err.rejection && err.rejection.name === 'NetworkError') {
      if (!this.isServerConnectionFailedAlertDisplayed) {
        this.isServerConnectionFailedAlertDisplayed = true;
        let alert = this.alertCtrl.create({
          title: 'Couldn\'t connect to server!',
          message: 'Please try again by clicking the button below.',
          enableBackdropDismiss: false,
          buttons: [
            {
              text: 'Retry',
              handler: () => {
                this.loader.showLoader();
                this.restartApplication();
              }
            }
          ]
        });
        alert.present();
      }
    } else {
      if(this.toaster) return;
      this.toaster = this.toastCtrl.create({
        message: 'Sorry, an error occured.' ,
        duration: 2000,
        position: 'bottom'
      });
      this.toaster.onDidDismiss(()=>{
        this.toaster = null;
      });
      this.toaster.present();
    }

  }

  private restartApplication() {
    window.location.href = this.initLocation;
  }
}
