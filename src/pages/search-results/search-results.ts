import {Component} from '@angular/core';
import {IonicPage, NavController, NavParams,ToastController} from 'ionic-angular';
import {TopicsProvider} from '../../providers/topics/topics';
import {CategoriesViewManager} from "../../lib/categories-view-manager";
import {TranslateService} from "@ngx-translate/core";


@IonicPage()
@Component({
  selector: 'page-search-results',
  templateUrl: 'search-results.html',
})
export class SearchResultsPage {
  public keyword: string;
  public results: Array<{}>;
  public selectedCategoryDefaultImage: string;
  public selectedCategoryForUppercase: string;
  public forcedCategoryTitle: string;
  private toaster = null;
  private progressVisible = true;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              private translate: TranslateService,
              private topicsProvider: TopicsProvider,
              private toastController:ToastController) {
  }

  ngOnInit() {
    this.keyword = this.navParams.get('keyword');
    // BEWARE: this is an asynchronous call to fetch the translations but the translations
    // should be fetched far before displaying those translations
    this.selectedCategoryForUppercase = this.translate.instant('result');
    this.forcedCategoryTitle = this.translate.instant('search');
    this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage('Search');
  }

  ionViewDidLoad() {
    this.progressVisible = true;
  }
  ionViewWillEnter() {
    //display loading
    this.topicsProvider.getTopicsByKeyword(this.keyword,1,0).then((topics:Array<{}>) => {
      this.results = topics;
      this.progressVisible = false;
      //hide loading
    });
    this.toaster = null;
  }

  public loadAnother(e){
    this.topicsProvider.getTopicsByKeyword(this.keyword,1,this.results.length).then((topics:Array<{}>) => {
      if(!topics)topics=[];
      e.complete();
      if(topics.length >= 1){
        this.results = this.results.concat(topics);
        return;
      }
      if(this.toaster) return;
      this.toaster = this.toastController.create({
        message: 'No Additional Resource Availiable' ,
        duration: 2000,
        position: 'top'
      });
      this.toaster.onDidDismiss(()=>{
        this.toaster = null;
      });
      this.toaster.present();
    }).catch((err)=>{
      e.complete();
      if(this.toaster) return;
      this.toaster = this.toastController.create({
        message: 'An error occurred' ,
        duration: 2500,
        position: 'bottom'
      });
      this.toaster.onDidDismiss(()=>{
        this.toaster = null;
      });
      this.toaster.present();
    });

  }

  ionViewDidLeave() {
  }
}
