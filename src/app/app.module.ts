import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {IonicApp, IonicModule} from 'ionic-angular';
import { MyApp } from './app.component';
import { AllTopicsPage } from '../pages/all-topics/all-topics';
import { SplashScreen } from '@ionic-native/splash-screen';
import { NotificationsProvider } from '../providers/notifications/notifications';
import {HttpClientModule} from "@angular/common/http";
import { IonicStorageModule } from '@ionic/storage';
import { TopicsProvider } from '../providers/topics/topics';
import {ScreenOrientation} from "@ionic-native/screen-orientation";
import { Network } from '@ionic-native/network';
import { NetworkProvider } from '../providers/network/network';
import { ImageLoadOptionProvider } from '../providers/image-load-option/image-load-option';
import { ApplicationSettingsProvider } from '../providers/applicationSettings/applicationSettings';
import { LoaderProvider } from '../providers/loader/loader';
import {ApiServiceProvider} from "../providers/api-service/apiService";
import {CustomErrorHandler} from "../providers/error/customErrorHandler";
import {AppVersion} from "@ionic-native/app-version";
import {ComponentsModule} from "../components/components.module";
import {PipesModule} from "../pipes/pipes.module";
import {TranslateModule} from "@ngx-translate/core";
import {translationServiceConfig} from "./translation-module-config";
import {SettingsPageModule} from "../pages/settings/settings.module";
import { SocialSharing } from '@ionic-native/social-sharing';
import {APP_CONFIG} from "../app/app-config"
import {WP_ENDPOINT_URL_TOKEN,WpV2ApiCaller} from "../providers/api-service/wp-v2-api-caller";

@NgModule({
  declarations: [
    MyApp,
    AllTopicsPage,
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp, {tabsPlacement: 'top'}),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    ComponentsModule,
    PipesModule,
    TranslateModule.forRoot(translationServiceConfig),
    SettingsPageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AllTopicsPage,
  ],
  providers: [
    SplashScreen,
    SocialSharing,
    NotificationsProvider,
    ApiServiceProvider,
    {provide:WP_ENDPOINT_URL_TOKEN , useValue:APP_CONFIG.apiEndpoint0},
    WpV2ApiCaller,
    TopicsProvider,
    ScreenOrientation,
    ApplicationSettingsProvider,
    LoaderProvider,
    Network,
    NetworkProvider,
    ImageLoadOptionProvider,
    CustomErrorHandler,
    {provide: ErrorHandler, useClass: CustomErrorHandler},
    AppVersion,
  ]
})
export class AppModule {}
