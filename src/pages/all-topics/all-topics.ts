import {Component, ViewChild} from '@angular/core';
import {Content, NavController, Platform, Refresher,ToastController} from 'ionic-angular';
import {TopicsProvider} from "../../providers/topics/topics";
import {TextManipulationService} from "../../lib/text-manipulation";
import {CategoriesViewManager} from "../../lib/categories-view-manager";
import {TopicsUpdatedInfo} from "../../models/TopicsUpdatedInfo";
import {CustomErrorHandler} from "../../providers/error/customErrorHandler";
import { NavParams } from 'ionic-angular/navigation/nav-params';

@Component({
  selector: 'page-all-topics',
  templateUrl: 'all-topics.html'
})
export class AllTopicsPage {
  @ViewChild(Content) content: Content;
  @ViewChild(Refresher) refresher: Refresher;

  public topics: Array<{}> = undefined;
  public category: {};
  public categoryForUppercase: string;
  public categoryDefaultImage: string;
  public isRefreshing: boolean = false;
  progressVisible = true;

  constructor(protected navCtrl: NavController,public navParams: NavParams,
    private customErrorHandler:CustomErrorHandler,
              private toastCtrl: ToastController,
              protected topicsProvider: TopicsProvider,
              protected platform:Platform,
              ) {
                this.topicsProvider.reloadRequired.subscribe((selectedCategory: {})=>{
                  if(selectedCategory['id']!=this.category['id']) return;
                  this.refreshArticles();
                });
  }

  ionViewDidLoad() {
    // set refresher values
    this.refresher.pullMin = 80;
    this.refresher.pullMax = 80 + 60;
    this.progressVisible = true;

    //set the state of the topic provider. We are viewing all topics
    this.topicsProvider.setTopicFilter(false);
    this.toaster = null;
    this.initPageData();
    this.refreshArticles();
  }

  initPageData(){
    
    this.category = this.navParams.get('category');
    this.categoryForUppercase = TextManipulationService.getUppercaseFriendlyText(this.category['name']);
    this.categoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage(this.category);
  }

  ionViewDidLeave() {
  }

  public displaySettingsPage() {
    this.navCtrl.push('SettingsPage');
  }

  private toaster = null;

  public refreshArticles(refresher=null) {
    if(refresher) this.isRefreshing = true;
    else this.progressVisible = true;
    if(this.category) this.topicsProvider.refreshTopics(this.category).then((topicsUpdatedInfo:TopicsUpdatedInfo) => {
      
      this.topics = topicsUpdatedInfo.topics;
      if(refresher){
        this.isRefreshing = false;
        window.setTimeout(()=>{
          refresher.complete();
        },2);
      }
      else this.progressVisible = false;
    }).catch((err)=>{
      if(refresher){
        this.isRefreshing = false;
        refresher.complete();
        if(this.toaster) return;
        this.toaster = this.toastCtrl.create({
          message: 'An error occurred' ,
          duration: 2500,
          position: 'bottom'
        });
        this.toaster.onDidDismiss(()=>{
          this.toaster = null;
        });
        this.toaster.present();
      }
      else {
        this.progressVisible = false;
        this.customErrorHandler.handleError(err);
      }
    });
  }

  public loadAnother(e){
    this.topicsProvider.refreshTopics(this.category,true).then((topicsUpdatedInfo:TopicsUpdatedInfo) => {

      console.log('loadAnother topicsUpdatedInfo:',topicsUpdatedInfo);
      e.complete();
      this.topics = topicsUpdatedInfo.topics;
      if(topicsUpdatedInfo.updatedSomething || this.toaster) return;
      
      this.toaster = this.toastCtrl.create({
        message: 'No Additional Resource Availiable' ,
        duration: 2000,
        position: 'top',
      });
      this.toaster.onDidDismiss(()=>{
        this.toaster = null;
      });
      this.toaster.present();
    }).catch((err)=>{
      e.complete();
      if(this.toaster) return;
      this.toaster = this.toastCtrl.create({
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
}