import {Component, ViewChild} from '@angular/core';
import {Content, NavController, Platform, Refresher,ToastController} from 'ionic-angular';
import {TopicsProvider} from "../../providers/topics/topics";
import {TextManipulationService} from "../../lib/text-manipulation";
import {CategoriesViewManager} from "../../lib/categories-view-manager";
import {Subscription} from "rxjs";
import {TopicsUpdatedInfo} from "../../models/TopicsUpdatedInfo";
import {LoaderProvider} from "../../providers/loader/loader";
import {CustomErrorHandler} from "../../providers/error/customErrorHandler";

@Component({
  selector: 'page-all-topics',
  templateUrl: 'all-topics.html'
})
export class AllTopicsPage {
  @ViewChild(Content) content: Content;
  @ViewChild(Refresher) refresher: Refresher;

  public topics: Array<{}>;
  public selectedCategory: {};
  public selectedCategoryForUppercase: string;
  public selectedCategoryDefaultImage: string;
  public isRefreshing: boolean = false;
  private topicsUpdatedSubscription: Subscription;

  constructor(protected navCtrl: NavController,
    private customErrorHandler:CustomErrorHandler,
              protected loader: LoaderProvider,
              private toastCtrl: ToastController,
              protected topicsProvider: TopicsProvider,
              protected platform:Platform,
              ) {
                this.topicsProvider.reloadRequired.subscribe((selectedCategory: {})=>{
                  this.setSelectedCategory(selectedCategory);
                  this.refreshArticles();
                });

  }

  ionViewDidLoad() {
    // set refresher values
    this.refresher.pullMin = 80;
    this.refresher.pullMax = 80 + 60;
  }

  ionViewWillEnter() { // 	Runs when the page is about to enter and become the active page.
    //set the state of the topic provider. We are viewing all topics
    this.topicsProvider.setTopicFilter(false);
    this.initPageData();
    this.subscribeToChanges("All News");

    this.toaster = null;
  }

  initPageData(){
    this.topics = this.topicsProvider.getTopics();
    this.setSelectedCategory(this.topicsProvider.getCategory());
  }

  private setSelectedCategory(selectedCategory){
    this.selectedCategory = selectedCategory;
    this.selectedCategoryForUppercase = TextManipulationService.getUppercaseFriendlyText(this.selectedCategory['name']);
    this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage(this.selectedCategory);
  }

  ionViewDidLeave() {
    this.unsubscribeToChanges();
  }

  protected unsubscribeToChanges() {
    this.topicsUpdatedSubscription.unsubscribe();
  }

  protected subscribeToChanges(nameOfFilter) {
    this.topicsUpdatedSubscription = this.topicsProvider.topicsUpdated.subscribe((topicsUpdatedInfo: TopicsUpdatedInfo) => {
      if (topicsUpdatedInfo == null) {
        this.topics = [];
        this.loader.showLoader();
      } else {
        this.loader.hideLoader();

        if (topicsUpdatedInfo.topics && topicsUpdatedInfo.topicsCount > 0) {
          this.topics = topicsUpdatedInfo.topics;
          this.selectedCategory = topicsUpdatedInfo.category;
          this.selectedCategoryForUppercase = TextManipulationService.getUppercaseFriendlyText(this.selectedCategory['name']);
          this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage(this.selectedCategory);
          // when the category is changed, scroll to top,
          // otherwise the scroll will remain on the place it was before the category change
          if(!topicsUpdatedInfo.continuation) this.content.scrollToTop();
          this.platform.ready().then(() => {
            //this.ga.trackView(nameOfFilter + ' page for ' + this.selectedCategory['name']);
          });
        } else {
          this.topics = [];
        }
      }
    }, error2 => console.log(error2));
  }

  public displaySettingsPage() {
    this.navCtrl.push('SettingsPage');
  }

  private toaster = null;

  public refreshArticles(refresher=null) {
    if(refresher) this.isRefreshing = true;
    else this.loader.showLoader();
    if(this.selectedCategory) this.topicsProvider.refreshTopics(this.selectedCategory).then(() => {
      if(refresher){
        this.isRefreshing = false;
        window.setTimeout(()=>{
          refresher.complete();
        },2);
      }
      else this.loader.hideLoader();
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
      else this.customErrorHandler.handleError(err);
    });
  }

  public loadAnother(e){

    this.topicsProvider.refreshTopics(this.selectedCategory,true).then((topicsUpdatedInfo:TopicsUpdatedInfo) => {
      e.complete();
      if(topicsUpdatedInfo.updatedSomething || this.toaster) return;
      this.toaster = this.toastCtrl.create({
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

