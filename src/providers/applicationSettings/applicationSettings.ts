import {Storage} from "@ionic/storage";
import {Injectable} from '@angular/core';
import {ApplicationSettings} from "../../models/applicationSettings";
import {ApiServiceProvider} from "../api-service/apiService";
import {Subject} from "rxjs";
import {APP_CONFIG} from "../../app/app-config";


@Injectable()
export class ApplicationSettingsProvider {

  public readonly allCategory = {id:'',name:'Home'};

  public applicationSettingsChanged: Subject<any>;

  constructor(private appStorage: Storage,
              private serviceClient: ApiServiceProvider) {
    this.applicationSettingsChanged = new Subject();
  }

  private getSelectedLanguage(): Promise<string> {
    return this.appStorage.get("selected-language");
  }

  private getSelectedCategories(): Promise<Array<{}>> {
    return true ? this.appStorage.get("selected-categories") : null;
  }

  private getFavoriteCategory(): Promise<{}> {
    return false ? this.appStorage.get("favorite-category") : new Promise((resolve)=>{
      resolve(this.allCategory);
    });
  }

  private getActiveTheme(): Promise<string> {
    return this.appStorage.get("active-theme");
  }

  public getAppHasBeenUsedBefore(): Promise<boolean> {
    return this.appStorage.get("app-been-used");
  }

  private setSelectedLanguage(language: string): Promise<any> {
    return this.appStorage.set("selected-language", language);
  }

  public setSelectedCategories(selectedCategories): Promise<Array<{}>> {
    return this.appStorage.set("selected-categories", selectedCategories);
  }

  public setFavoriteCategory(favoriteCategory:{}): Promise<{}> {
    return this.appStorage.set("favorite-category", favoriteCategory);
  }

  private setActiveTheme(theme: string): Promise<any> {
    return this.appStorage.set("active-theme", theme);
  }

  public setAppHasBeenUsedBefore(appBeenUsed: boolean): Promise<boolean> {
    return this.appStorage.set("app-been-used", appBeenUsed);
  }

  public getApplicationSettings( ): Promise<ApplicationSettings> {
    return new Promise((resolve) => {
      Promise.all([
        this.getActiveTheme(),
        this.getSelectedLanguage(),
        this.getSelectedCategories(),
        this.getFavoriteCategory()])
        .then(([activeThemeFromStorage, languageFromStorage, categoriesFromStorage, favoriteCategoryFromStorage]) => {
          this.checkIfAllApplicationSettingsAreSetOrSetDefaultValues(
            activeThemeFromStorage,
            languageFromStorage,
            categoriesFromStorage,
            favoriteCategoryFromStorage)
            .then(([activeTheme, language, categories, favoriteCategory]) => {
              resolve(new ApplicationSettings(activeTheme, language, categories, favoriteCategory));
            });
        });
    });
  }

  private checkIfAllApplicationSettingsAreSetOrSetDefaultValues(activeThemeFromStorage,
                                                                languageFromStorage,

                                                                categoriesFromStorage,
                                                                favoriteCategoryFromStorage): Promise<any> {
    let activeThemePromise = new Promise((resolveThemePromise) => {
      if (activeThemeFromStorage) {
        resolveThemePromise(activeThemeFromStorage);
      } else {
        // set light as default theme, if none is selected
        let newTheme: string = 'Light';
        this.setActiveTheme(newTheme).then(() => {
          resolveThemePromise(newTheme);
        })
      }
    });

    let languagePromise = new Promise((resolveLanguagePromise) => {
      if (languageFromStorage) //language already exists
        resolveLanguagePromise(languageFromStorage);
      else {
        // get device preferred language
        // (e.g. preferred language might be something like 'en-US' and we only need 'en',
        // so we check if the language is 'el', otherwise it will be 'en')
        let deviceLang = (navigator.language.substr(0, 2).toLowerCase() === 'el') ? 'EL' : 'EN';
        this.setSelectedLanguage(deviceLang).then(() => resolveLanguagePromise(deviceLang));
      }
    });

    let categoriesPromise = new Promise((resolveCategPromise) => {

      if ( Array.isArray(categoriesFromStorage) ) //categories already set
        resolveCategPromise(categoriesFromStorage);
      else {
        //when we have the language
        Promise.all([languagePromise]).then((values) => {
          let language: string = values[0].toString();

          //fetch from service, get all categories
          let defaultCategories:Promise<Array<{}>> = this.serviceClient.getCategories(language);

          //save to local storage and we are done! now we have default categories
          this.setSelectedCategories(defaultCategories)
            .then(() => {
              defaultCategories.then((_defaultCategories)=>{
                // add all category as first in list.
                resolveCategPromise(_defaultCategories);
              });
            });
        });
      }
    });

    let favoriteCategoryPromise = new Promise((resolveFavCategPromise) => {
      if (favoriteCategoryFromStorage) //favorite category already set
        resolveFavCategPromise(favoriteCategoryFromStorage);
      else {
        Promise.all([languagePromise, categoriesPromise]).then((values) => {
          // set default favourite category depending on system language, values[0] is the language code
          let defaultFavCategory = APP_CONFIG['defaultFavouriteCategory_' + values[0]];
          this.setFavoriteCategory(defaultFavCategory).then(() => {
            resolveFavCategPromise(defaultFavCategory);
          });
        })
      }
    });

    return Promise.all([activeThemePromise, languagePromise, categoriesPromise, favoriteCategoryPromise]);
  }

  private allAvailableCategories ;
  public async getAllAvailableCategories( language , force = false):Promise<Array<{}>> {
    if( force || !Array.isArray(this.allAvailableCategories)) 
      this.allAvailableCategories = await this.serviceClient.getCategories(language);
    let hiddenCategories = ['video', 'uncategorized', 'comments'];
    let tempFiles = this.allAvailableCategories.slice(0);
    tempFiles.forEach((element) => {
      if(hiddenCategories.indexOf(element['slug']) != -1){
        let removeIndex = this.allAvailableCategories.map((item) => item['slug']).indexOf(element['slug']);
        this.allAvailableCategories.splice(removeIndex, 1);
      }
    });
    return Promise.resolve(this.allAvailableCategories);
  }

  public async changeApplicationLanguage(newLanguage: string): Promise<ApplicationSettings> {
    let setLanguagePromise = this.setSelectedLanguage(newLanguage);
    let getCategoriesPromise = this.getSelectedCategories();
    let favoriteCategory = APP_CONFIG['defaultFavouriteCategory_' + newLanguage];
    let setFavoritePromise = this.setFavoriteCategory(favoriteCategory);
    let getThemePromise = this.getActiveTheme();

    //when all writes to local storage complete, fire events
    return new Promise<ApplicationSettings>((resolve) => {
      Promise.all([getThemePromise, setLanguagePromise, getCategoriesPromise, setFavoritePromise])
        .then(([theme,language,categories]) => {
          let applicationSettings = new ApplicationSettings(theme, newLanguage, categories, favoriteCategory);
          resolve(applicationSettings);
          this.applicationSettingsChanged.next(applicationSettings);
        });
    })
  }

  public changeSelectedCategories(newCategories:Array<{}>) {
    return new Promise((resolve) => {
      let setCategoriesPromise = this.setSelectedCategories(newCategories);
      // if default favourite category for english exists in newCategories, set it,
      // else check if the favourite category in greek exists and set it, otherwise, just set the first category
      let favoriteCategory = /*newCategories.indexOf(APP_CONFIG['defaultFavouriteCategory_EN']) !== -1 ?
        APP_CONFIG['defaultFavouriteCategory_EN'] :
          (newCategories.indexOf(APP_CONFIG['defaultFavouriteCategory_EL']) !== -1 ?
            APP_CONFIG['defaultFavouriteCategory_EL'] : newCategories[0]) */ newCategories[0];
      let setFavoriteCatPromise = this.setFavoriteCategory(favoriteCategory );
      let getLanguagePromise = this.getSelectedLanguage();
      let getThemePromise = this.getActiveTheme();

      Promise.all([getThemePromise, getLanguagePromise,setCategoriesPromise,setFavoriteCatPromise])
          .then(([theme, language])=>{

            let applicationSettings = new ApplicationSettings((theme as string), (language as string), newCategories, favoriteCategory);

            resolve(applicationSettings);
            this.applicationSettingsChanged.next(applicationSettings);
          });
    });
  }

  public changeActiveTheme(newTheme: string) {
    let setThemePromise = this.setActiveTheme(newTheme);
    let getLanguagePromise = this.getSelectedLanguage();
    let getCategoriesPromise = this.getSelectedCategories();
    let getFavoritePromise = this.getFavoriteCategory();

    return new Promise((resolve) => {
      Promise.all([setThemePromise, getLanguagePromise, getCategoriesPromise, getFavoritePromise])
        .then(([theme, language, categories, favoriteCategory]) => {
          let applicationSettings = new ApplicationSettings(theme, language, categories, favoriteCategory);
          resolve(applicationSettings);
          this.applicationSettingsChanged.next(applicationSettings);
        });
    })
  }
}
