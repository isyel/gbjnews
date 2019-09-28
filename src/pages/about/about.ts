import {Component} from '@angular/core';
import {IonicPage,  Platform} from 'ionic-angular';
import {AppVersion} from '@ionic-native/app-version';

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html',
})
export class AboutPage {
  public versionCode: any;
  public versionNumber: any;

  constructor(private appVersion: AppVersion,
              private platform: Platform) {
  }

  ngOnInit() {
    if (this.platform.is("cordova"))
    {
      this.appVersion.getVersionCode().then((versionCode) => {
        this.versionCode = versionCode;
      })
      this.appVersion.getVersionNumber().then((versionNumber) => {
        this.versionNumber = versionNumber;
      })
    }
  }

}
