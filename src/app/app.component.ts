
import {Component, ViewChild} from '@angular/core';
import {NavController, Platform, MenuController, AlertController, App} from 'ionic-angular';

import {ScreenOrientation} from '@ionic-native/screen-orientation';
import {TranslateService} from "@ngx-translate/core";
import {ApplicationSettings} from "../models/applicationSettings";

import {ApplicationSettingsProvider} from "../providers/applicationSettings/applicationSettings";
import {SettingsPage} from "../pages/settings/settings";
import {APP_CONFIG} from "../app/app-config";
import {Storage} from "@ionic/storage";

import { ContainerPage } from '../pages/container/container';
import { SplashPage } from '../pages/splash/splash';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild('mainNav') navCtrl: NavController;
  rootPage: any = SplashPage;

  selectedTheme: string;
  
  constructor(private platform: Platform,
              private screenOrientation: ScreenOrientation,
              private settingsProvider: ApplicationSettingsProvider,
              private translate: TranslateService,
              private alertCtrl: AlertController,
              private appCtrl: App,
              private menuCtrl:MenuController,
              private appStorage: Storage) {
  }

  ngOnInit() {
    this.platform.ready().then(()=>{

      // Suppose this app was installed newly, some categories will be checked by default
      this.appStorage.get("selected-categories").then( async (data) =>{
        let f = this.platformReadyHandler.bind(this);
        if(!Array.isArray(data)){
          let categories = await this.settingsProvider.getAllAvailableCategories(null);
          if(categories){
            let defaultCategoryNames = APP_CONFIG.defaultCategoryNames;
            categories = categories
              .filter( d => defaultCategoryNames.map(e=>e.toLowerCase()).indexOf(d['name'].toLowerCase()) < 0 );
            this.settingsProvider.setSelectedCategories( categories ).then(()=>{
              f();
            });
          }
          else f();
        }
        else f();
      });
    });

    this.settingsProvider.applicationSettingsChanged.subscribe(this.handleApplicationSettingsChange.bind(this));
  }

  private displayFirstTimeAlert(applicationSettings: any) {
    this.settingsProvider.getAppHasBeenUsedBefore().then((appHasBeenUsedBefore) => {
      if (!appHasBeenUsedBefore) {
        let alert = this.alertCtrl.create({
          title: this.translate.instant("Welcome to NewSum!"),
          message: `<p>${this.translate.instant("App Talk")}</p>`,
          cssClass: applicationSettings.activeTheme.toLowerCase() + '-theme',
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.settingsProvider.setAppHasBeenUsedBefore(true);
              }
            },
            {
              text: this.translate.instant("Go to settings"),
              handler: () => {
                this.settingsProvider.setAppHasBeenUsedBefore(true);
                this.appCtrl.getRootNav().push(SettingsPage);
              }
            }
          ],
          enableBackdropDismiss: false
        });
        alert.present();
      }
    });
  }

  private handleApplicationSettingsChange(newApplicationSettings: ApplicationSettings) {
    this.selectedTheme = newApplicationSettings.activeTheme.toLowerCase() + '-theme';
  }

  private platformReadyHandler() {

    this.settingsProvider.getAllAvailableCategories(null, true);

    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {
            
      this.translate.setDefaultLang(applicationSettings.language.toLowerCase());
      this.translate.use(applicationSettings.language.toLowerCase()).subscribe(() => {
        this.displayFirstTimeAlert(applicationSettings);
      });

      // should be set immediately not so far from making container page the root
      this.selectedTheme = applicationSettings.activeTheme.toLowerCase() + '-theme';
      
      this.navCtrl.setRoot(ContainerPage);
    });
    this.screenOrientation.lock('portrait').then(() => console.log('Screen orientation locked successfully'),
      error => console.error('An error occurred while trying to lock screen orientation', error)
    );
  }

  goToAbout() {
    this.navCtrl.push('AboutPage');
    this.menuCtrl.close();
  }

  goToSettings() {
    this.navCtrl.push(SettingsPage);
    this.menuCtrl.close();
  }

  goToContactUs() {
    //this.ga.trackView("Privacy policy page");
    const url = "http://govandbusinessjournal.com.ng/contact-us/";
    window.open(url, 'location=yes');
    this.menuCtrl.close();
  }

  goToAdvertising() {
    //this.ga.trackView("Privacy policy page");
    const url = "http://govandbusinessjournal.com.ng/advert/advert_rate.pdf";
    window.open(url, 'location=yes');
    this.menuCtrl.close();
  }

  // private checkForNewUpdates() {
  //   if (this.platform.is('cordova')) {
  //     this.codePush.sync().subscribe((syncStatus) => {
  //       console.log(syncStatus);
  //     });

  //     const downloadProgress = (progress) => {
  //       console.log(`Downloaded ${progress.receivedBytes} of ${progress.totalBytes}`);
  //     }
  //     this.codePush.sync({}, downloadProgress).subscribe((syncStatus) => console.log(syncStatus));
  //   }
  // }

  // private initGoogleAnalytics() {
  //   this.ga.startTrackerWithId('UA-31632742-8')
  //     .then(() => {
  //       console.log("google analytics started");
  //     })
  //     .catch(e => console.log('Error starting GoogleAnalytics', e));
  // }
}
