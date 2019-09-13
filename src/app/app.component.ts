
import {Component, ViewChild} from '@angular/core';
import {NavController, Platform, MenuController, AlertController, App} from 'ionic-angular';
import {SplashScreen} from '@ionic-native/splash-screen';
import {AllTopicsPage} from '../pages/all-topics/all-topics';
import {ScreenOrientation} from '@ionic-native/screen-orientation';
import {TranslateService} from "@ngx-translate/core";
import {ApplicationSettings} from "../models/applicationSettings";
import {LoaderProvider} from "../providers/loader/loader";
import {TopicsProvider} from "../providers/topics/topics";
import {ApplicationSettingsProvider} from "../providers/applicationSettings/applicationSettings";
import {SettingsPage} from "../pages/settings/settings";
import {APP_CONFIG} from "../app/app-config";
import {Storage} from "@ionic/storage";

import {CustomErrorHandler} from "../providers/error/customErrorHandler";

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild('mainNav') navCtrl: NavController;
  rootPage: any = AllTopicsPage;
  availableCategories: Array<{}>;
  selectedTheme: string;
  selectedIndex:number = 0;
  selectedCategory:{} = this.settingsProvider.allCategory;

  private reloadRoot:boolean = false;

  constructor(private platform: Platform,
    private customErrorHandler:CustomErrorHandler,
              private screenOrientation: ScreenOrientation,
              private splashScreen: SplashScreen,
              private menuCtrl: MenuController,
              private settingsProvider: ApplicationSettingsProvider,
              private topicsProvider: TopicsProvider,
              private loader: LoaderProvider,
              private translate: TranslateService,
              private alertCtrl: AlertController,
              private appCtrl: App,
              private appStorage: Storage) {
  }

  ngOnInit() {
    this.platform.ready().then(()=>{

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
    this.topicsProvider.categoryUpdated.subscribe(i=>{
      this.setSelectedIndex(i);
    });

    this.appCtrl.viewDidEnter.subscribe(()=>{

      // dispatch on another cycle to skip bug below(this.navCtrl.getActive().component may return incorrect result).
      window.setTimeout(()=>{
        if(this.navCtrl.getActive().component === AllTopicsPage && this.reloadRoot){
          this.reloadRoot = false;
          this.topicsProvider.reloadRequired.next(this.selectedCategory);
          //(this.navCtrl.getActive().component as AllTopicsPage).justReload(this.selectCategory);
        }
      },2);

    });

  }

  private displayFirstTimeAlert(applicationSettings: any) {
    this.settingsProvider.getAppHasBeenUsedBefore().then((appHasBeenUsedBefore) => {
      if (!appHasBeenUsedBefore) {
        let alert = this.alertCtrl.create({
          title: this.translate.instant("Welcome to NewSum!"),
          message: `<p>${this.translate.instant("This version uses")} ` +
            `${this.translate.instant("RSS sources from popular websites to summarize your daily news.")}</p>` +
            `<p>${this.translate.instant("You can configure (add or remove) these RSS sources via Settings.")}</p>`,
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

  private platformReadyHandler() {
    this.rootPage = AllTopicsPage;
    this.loader.showLoader();
    this.splashScreen.hide();

    this.settingsProvider.getAllAvailableCategories(null, true);

    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {
      this.selectedTheme = applicationSettings.activeTheme.toLowerCase() + '-theme';
      this.translate.setDefaultLang(applicationSettings.language.toLowerCase());
      this.translate.use(applicationSettings.language.toLowerCase()).subscribe(() => {
        this.displayFirstTimeAlert(applicationSettings);
      });
      this.availableCategories = Array.of<any>(this.settingsProvider.allCategory).concat(applicationSettings.categories);
      this.topicsProvider.refreshTopics(applicationSettings.favoriteCategory);
    });
    this.screenOrientation.lock('portrait').then(() => console.log('Screen orientation locked successfully'),
      error => console.error('An error occurred while trying to lock screen orientation', error)
    );
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

  private handleApplicationSettingsChange(newApplicationSettings: ApplicationSettings) {
    this.reloadRoot = false;
    this.selectedTheme = newApplicationSettings.activeTheme.toLowerCase() + '-theme';
    this.availableCategories = Array.of<any>(this.settingsProvider.allCategory).concat(newApplicationSettings.categories);
    //console.log("refreshing category: " + newApplicationSettings.favoriteCategory);

    let ix = this.availableCategories.map(c=>c['id']).indexOf(this.selectedCategory['id']);
    if( ix < 0 ) {
      ix = this.selectedIndex = 0;
      //this.topicsProvider.refreshTopics(newApplicationSettings.favoriteCategory, false);
      this.reloadRoot = true;
    }
    else{
      this.selectedIndex = ix;
    }
    this.selectedCategory = this.availableCategories[ix];
  }

  // private initGoogleAnalytics() {
  //   this.ga.startTrackerWithId('UA-31632742-8')
  //     .then(() => {
  //       console.log("google analytics started");
  //     })
  //     .catch(e => console.log('Error starting GoogleAnalytics', e));
  // }

  public selectCategory(newSelectedCategory: {},i:number) {
    this.setSelectedIndex(i);
    this.loader.showLoader();
    this.menuCtrl.close();
    this.selectedCategory = newSelectedCategory;
    this.topicsProvider.refreshTopics(newSelectedCategory).catch((e)=>{
      this.customErrorHandler.handleError(e);
    });
  }

  public setSelectedIndex(i:number){
    this.selectedIndex = i;
  }

  public searchForTopic(e: any, searchInput: string) {
    this.reloadRoot = false;
    if (e.keyCode === 13 && searchInput) {
      this.loader.showLoader();
      this.navCtrl.push('SearchResultsPage', {keyword: searchInput});
      this.menuCtrl.close();
    }
  }
}
