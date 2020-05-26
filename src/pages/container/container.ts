import { Component } from '@angular/core';
import { NavController, NavParams, App } from 'ionic-angular';
import {AllTopicsPage} from '../all-topics/all-topics';
import { TopicsProvider } from '../../providers/topics/topics';
import { ApplicationSettingsProvider } from '../../providers/applicationSettings/applicationSettings';
import { ApplicationSettings } from '../../models/applicationSettings';
import { SuperTabsController } from 'ionic2-super-tabs';

/**
 * Generated class for the ContainerPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-container',
  templateUrl: 'container.html',
})
export class ContainerPage {

  private readonly page = AllTopicsPage;

  availableCategories: Array<{}>;

  selectedIndex:number = 0;
  selectedCategory:{} = this.settingsProvider.allCategory;

  private reloadRoot:boolean = false;

  private active = true;

  constructor(private superTabsCtrl: SuperTabsController, public navCtrl: NavController, 
    private topicsProvider: TopicsProvider, private appCtrl: App, 
    private settingsProvider: ApplicationSettingsProvider, public navParams: NavParams) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ContainerPage');

    this.active = true;
    
    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {

      this.availableCategories = this.preprocessCategories(Array.of<any>(this.settingsProvider.allCategory).concat(applicationSettings.categories));
      //this.topicsProvider.refreshTopics(applicationSettings.favoriteCategory);

      window.setTimeout(()=>{

        const targetCategory = this.navParams.get('targetCategory');

        if(targetCategory){
          
          const ix = this.availableCategories.findIndex((category)=>{
            return category['id'] == targetCategory['id'];
          });
  
          if(ix>-1){
            console.log('index of targetCategory: ',ix);
            this.superTabsCtrl.slideTo(ix);
          }
        }
      });
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

    this.settingsProvider.applicationSettingsChanged.subscribe(this.handleApplicationSettingsChange.bind(this));
    this.topicsProvider.categoryUpdated.subscribe(i=>{
      this.setSelectedIndex(i);
    });
  }

  ionViewWillUnload(){
    this.active = false;
  }

  private handleApplicationSettingsChange(newApplicationSettings: ApplicationSettings) {
    if(!this.active) return;
    this.reloadRoot = false;

    const useReload = true;

    // we had to use this heavy way, to reload the whole page, because the approach below is not working
    if(useReload) this.navCtrl.setRoot(ContainerPage,{
      targetCategory:this.selectedCategory,
    });

    else{
      this.availableCategories = this.preprocessCategories(Array.of<any>(this.settingsProvider.allCategory).concat(newApplicationSettings.categories));
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
  }

  public preprocessCategories(availableCategories){
    return availableCategories.map((availableCategory:any)=>{
      availableCategory.name = availableCategory.name.replace('&amp;','&');
      return availableCategory;
    });
  }

  public searchForTopic(e: any, searchInput: string) {
    this.reloadRoot = false;
    if (e.keyCode === 13 && searchInput) {
      this.navCtrl.push('SearchResultsPage', {keyword: searchInput});
    }
  }

  onTabSelect(ev: any) {
    console.log('onTabSelect : ',ev);
    if(ev.index==0) this.selectCategory(this.settingsProvider.allCategory,ev.index);
    else this.settingsProvider.getAllAvailableCategories(null).then((categories)=>{
      this.selectCategory(categories.find((category)=>{
        return category['id'] == ev.id;
      }),ev.index);
    });
  }

  public setSelectedIndex(i:number){
    this.selectedIndex = i;
  }

  public selectCategory(newSelectedCategory: {},i:number) {
    this.setSelectedIndex(i);
    this.selectedCategory = newSelectedCategory;

    /*this.topicsProvider.refreshTopics(newSelectedCategory).catch((e)=>{
      this.customErrorHandler.handleError(e);
    });*/
  }
}
