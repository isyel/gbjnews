import {Component} from '@angular/core';
import {NavController, NavParams, AlertController, IonicPage} from 'ionic-angular';
import {ApplicationSettingsProvider} from "../../providers/applicationSettings/applicationSettings";
import {ApplicationSettings} from "../../models/applicationSettings";
import {ImageLoadOptionProvider} from "../../providers/image-load-option/image-load-option";
import {TranslateService} from "@ngx-translate/core";
@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public selectedLangName: string;
  public favoriteCategory: {};
  public selectedCategoriesStringified: string;
  public selectedImagesLoadOption: string;
  public selectedTheme: string;
  private static availableLanguages: any = {
    'EL': 'Ελληνικά',
    'EN': 'English'
  };
  private availableImageLoadingOptions: any = {};
  private selectCapsText: string;
  private cancelCapsText: string;
  private selectText: string;
  private languageText: string;
  private favoriteCategoryText: string;
  private categoriesText: string;
  private imagesLoadText: string;
  private themeText: string;
  // private allText: string;
  // private selectedText: string;
  private incorrectSelectionTitleText: string;
  private incorrectSelectionCategoriesText: string;


  constructor(public navCtrl: NavController, public navParams: NavParams,
              private alertCtrl: AlertController,
              private translate: TranslateService,
              private imgLoadProvider: ImageLoadOptionProvider,
              protected settingsProvider: ApplicationSettingsProvider) {

    this.fetchTranslationsAndUpdateDefaultValues(this.translate.currentLang);

    this.translate.onLangChange.subscribe(()=>{console.log("settings: on lang change")});
    this.translate.get("Αll news").subscribe((data)=>console.log(data));
  }

  private displayErrorAlert(title: string, message: string) {
    let alert = this.alertCtrl.create();
    alert.setTitle(title);
    alert.setCssClass(this.selectedTheme.toLowerCase() + '-theme');
    alert.setMessage(message);
    alert.addButton('OK');
    alert.present();
  }

  public selectLanguage() {
    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {
      let alert = this.alertCtrl.create();
      let selectedLang = applicationSettings.language;
      alert.setTitle(this.selectText + ' ' + this.languageText);
      alert.setCssClass(this.selectedTheme.toLowerCase() + '-theme');

      for (let prop in SettingsPage.availableLanguages) {
        if (SettingsPage.availableLanguages.hasOwnProperty(prop)) {
          alert.addInput({
            type: 'radio',
            label: SettingsPage.availableLanguages[prop],
            value: prop,
            checked: (prop === selectedLang)
          });
        }
      }

      alert.addButton(this.cancelCapsText);
      alert.addButton({
        text: this.selectCapsText,
        handler: (lang: string) => {
          if (lang != selectedLang)
            this.handleLanguageChange(lang);
        }
      });
      alert.present();
    });
  }

  private handleLanguageChange(lang) {
    this.selectedLangName = SettingsPage.availableLanguages[lang];
    this.settingsProvider
      .changeApplicationLanguage(lang)
      .then(() => {
        this.translate.use(lang.toLowerCase()).subscribe(() => {
          this.fetchTranslationsAndUpdateDefaultValues(lang.toLowerCase());// update translations at this page;
        }); //update translation service
      });
  }

  public selectFavoriteCategory() {
    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {
      let alert = this.alertCtrl.create();
      let favoriteCategory = applicationSettings.favoriteCategory;
      let categories:Array<{}> = applicationSettings.categories;
      alert.setTitle(this.selectText + ' ' + this.favoriteCategoryText);
      alert.setCssClass(this.selectedTheme.toLowerCase() + '-theme');

      for (let i = 0; i < categories.length; i++) {
        alert.addInput({
          type: 'radio',
          label: categories[i]['name'],
          value: categories[i]['id'],
          checked: (categories[i]['id'] === favoriteCategory['id'])
        });
      }

      alert.addButton(this.cancelCapsText);
      alert.addButton({
        text: this.selectCapsText,
        handler: (category0: Array<number>) => {
          let category:{} = categories.find((category:Array<any>)=>{
            return category['id'] == category0;
          });
          this.favoriteCategory = category;
          this.settingsProvider.setFavoriteCategory(category);
        }
      });

      alert.present();
    });
  }

  public selectCategories() {
    this.settingsProvider.getApplicationSettings().then(( async (applicationSettings: ApplicationSettings) => {
      let alert = this.alertCtrl.create();
      let selectedCategories = applicationSettings.categories;
      

      let categories = await this.settingsProvider.getAllAvailableCategories(applicationSettings.language);
      console.log("Categories: ", categories);

      alert.setTitle(this.selectText + ' ' + this.categoriesText);
      alert.setCssClass(this.selectedTheme.toLowerCase() + '-theme');

      for (let i = 0; i < categories.length; i++) {
        alert.addInput({
          type: 'checkbox',
          label: categories[i]['name'].replace('&amp;','&'),
          value: categories[i]['id'],
          checked: (selectedCategories.map(c=>c['id']).indexOf(categories[i]['id']) >= 0)
        });
      }

      alert.addButton(this.cancelCapsText);
      alert.addButton({
        text: this.selectCapsText,
        handler: (_selectedCategories:Array<number>) => {
          if (_selectedCategories.length > 0) {

            this.selectedCategoriesStringified = _selectedCategories.join();
            categories = categories.filter((category:Array<any>)=>{
              return _selectedCategories.indexOf(category['id']) > -1;
            });

            this.settingsProvider.changeSelectedCategories(categories).then(() => this.updateDefaultValues());

          } else {
            this.displayErrorAlert(this.incorrectSelectionTitleText, this.incorrectSelectionCategoriesText);
            return false;
          }
        }
      });

      alert.present();
    }));
  }

  public selectImagesOption() {
    let alert = this.alertCtrl.create();
    let selectedOption: string = this.imgLoadProvider.getSelectedImageLoadOption();
    alert.setTitle(this.selectText + ' ' + this.imagesLoadText);
    alert.setCssClass(this.selectedTheme.toLowerCase() + '-theme');

    for (let prop in this.availableImageLoadingOptions) {
      if (this.availableImageLoadingOptions.hasOwnProperty(prop)) {
        alert.addInput({
          type: 'radio',
          label: this.availableImageLoadingOptions[prop],
          value: prop,
          checked: (prop === selectedOption)
        });
      }
    }

    alert.addButton(this.cancelCapsText);
    alert.addButton({
      text: this.selectCapsText,
      handler: (imgOption: string) => {
        this.imgLoadProvider.setSelectedImageLoadOption(imgOption);
        this.updateDefaultValues();
      }
    });

    alert.present();
  }

  public selectTheme() {
    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {
      let alert = this.alertCtrl.create();
      let activeTheme = applicationSettings.activeTheme;
      let themes = ['Dark', 'Light'];
      alert.setTitle(this.selectText + ' ' + this.themeText);
      alert.setCssClass(this.selectedTheme.toLowerCase() + '-theme');

      for (let i = 0; i < themes.length; i++) {
        alert.addInput({
          type: 'radio',
          label: themes[i],
          value: themes[i],
          checked: (themes[i] === activeTheme)
        });
      }

      alert.addButton(this.cancelCapsText);
      alert.addButton({
        text: this.selectCapsText,
        handler: (newTheme: string) => {
          this.settingsProvider.changeActiveTheme(newTheme)
            .then(() => this.updateDefaultValues()
          );
        }
      });

      alert.present();
    });
  }

  private fetchTranslationsAndUpdateDefaultValues(lang: string) {
    this.availableImageLoadingOptions.all = this.translate.instant("Always load images");
    this.availableImageLoadingOptions.wifi = this.translate.instant("Load images only with WiFi");
    this.selectCapsText = this.translate.instant("SELECT");
    this.cancelCapsText = this.translate.instant("CANCEL");
    this.selectText = this.translate.instant("Select");
    this.languageText = this.translate.instant("Language");
    this.favoriteCategoryText = this.translate.instant("Favorite Category2");
    this.categoriesText = this.translate.instant("Categories");
    this.imagesLoadText = this.translate.instant("Images Load2");
    this.themeText = this.translate.instant("Theme");
    // this.allText = this.translate.instant("All");
    // this.selectedText = this.translate.instant("selected");
    this.incorrectSelectionTitleText = this.translate.instant("Incorrect Selection");
    this.incorrectSelectionCategoriesText = this.translate.instant("You need to select at least one category");
    this.updateDefaultValues();
  }

  private updateDefaultValues() {
    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {
      this.selectedLangName = SettingsPage.availableLanguages[applicationSettings.language];
      this.favoriteCategory = applicationSettings.favoriteCategory;
      let selectedCategories = applicationSettings.categories;
      this.selectedCategoriesStringified = selectedCategories.map((c:any)=>c['name']).join();
      this.selectedImagesLoadOption = this.availableImageLoadingOptions[
        this.imgLoadProvider.getSelectedImageLoadOption()
        ];
      this.selectedTheme = applicationSettings.activeTheme;
    });
  }
}
