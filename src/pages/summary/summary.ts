import {Component, ViewChild} from '@angular/core';
import {Content, IonicPage, NavParams, Platform,ToastController} from 'ionic-angular';
import {TopicsProvider} from "../../providers/topics/topics";
import {CategoriesViewManager} from "../../lib/categories-view-manager";
import {Subscription} from "rxjs";
import {ImageLoadOptionProvider} from "../../providers/image-load-option/image-load-option";
import {NetworkProvider} from "../../providers/network/network";
import {LoaderProvider} from "../../providers/loader/loader";
import { SocialSharing } from '@ionic-native/social-sharing';
import {WpV2ApiCaller} from "../../providers/api-service/wp-v2-api-caller";
import {CommentsComponent} from "../../components/comments/comments";
import { ModalController } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-summary',
  templateUrl: 'summary.html',
})
export class SummaryPage {
  @ViewChild(Content) content: Content;

  public selectedCategory: {};
  public selectedCategoryDefaultImage: string;
  public selectedTopic: any;
  public selectedImage:string;
  public isSearch: boolean;
  public isConnectedToWiFi: boolean = false;
  public commentcount:number = 1;
  commentComment = '';
  commentName='';
  commentEmail='';
  commentWebsite='';
  public topicUpdatedSubscription: Subscription;
  private networkConnectionChangeSubscription: Subscription;

  constructor(public modalCtrl: ModalController,private navParams: NavParams,
              private socialSharing: SocialSharing,
              private topicsProvider: TopicsProvider,
              private imgLoadProvider: ImageLoadOptionProvider,
              private networkProvider: NetworkProvider,
              private toastController:ToastController,
              private platform: Platform,
              private wpV2ApiCaller :WpV2ApiCaller,
              private loader: LoaderProvider) {
  }

  ionViewDidLoad() {
    this.subscribeToChanges();
  }

  private toaster = null;
  ionViewDidEnter() {
    // initialize variable because we may not have an update from observable
    this.isConnectedToWiFi = this.networkProvider.network.type === 'wifi';
    this.subscribeToNetworkConnectionChanges();
    this.initPage();
    this.toaster = null;
  }

  ionViewDidLeave() {
    this.unsubscribeToChanges();
    this.unsubscribeFromNetworkConnectionChanges();
  }

  subscribeToChanges() {
    this.topicUpdatedSubscription = this.topicsProvider.selectedTopicUpdated.subscribe((data) => {
      if (data == null) {
        this.selectedTopic = null;
        this.selectedImage = null;
      } else {
        this.loader.hideLoader();
        this.selectedCategory = data.category;
        this.selectedTopic = data.topic;
        this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage(data.category);
        let selectedImgLoadOption = this.imgLoadProvider.getSelectedImageLoadOption();
        this.selectedImage = this.selectedTopic.imageUrls.length > 0
        && (this.isConnectedToWiFi || selectedImgLoadOption === 'all') ?
        this.selectedTopic.imageUrls[0] : this.selectedCategoryDefaultImage;

        this.content.scrollToTop();
        //this.ga.trackView("Summary: " + this.selectedTopic.Title);
      }
    });
  }

  unsubscribeToChanges() {
    this.topicUpdatedSubscription.unsubscribe();
  }

  initPage() {
    this.isSearch = this.navParams.get('isSearch');
    this.selectedCategory = this.topicsProvider.getCategory();
    if (this.isSearch) {
      this.selectedCategory = this.navParams.get('forcedCategoryTitle');
      this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage('Search');
    } else {
      this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage(this.selectedCategory);
    }
  }

  swipeActivity(event) {
    this.loader.showLoader();
    if (event.direction == 2)
      this.topicsProvider.loadNextTopic(this.selectedCategory, this.selectedTopic, this.isSearch);
    else if (event.direction == 4)
      this.topicsProvider.loadPreviousTopic(this.selectedCategory, this.selectedTopic, this.isSearch);
  }

  share(){
    this.socialSharing.share(this.selectedTopic['title']['rendered'],this.selectedTopic['excerpt']['rendered'],null,
    this.selectedTopic['link']);
  }

  postComment(){
    let errf = (err)=>{
      if(this.toaster) return;
      this.toaster = this.toastController.create({
        message: err ,
        duration: 2000,
        position: 'top'
      });
      this.toaster.onDidDismiss(()=>{
        this.toaster = null;
      });
      this.toaster.present();
    };
    let err = '';
    if(!this.commentName) err="Please enter a valid name";
    else if(!this.commentEmail) err="Please enter a valid email address";
    else if(!this.commentComment) err="Please type your comment";
    else{
      this.wpV2ApiCaller.postComment( this.selectedTopic, this.commentName,this.commentEmail,this.commentComment,this.commentWebsite )
      .then(()=>{
        this.commentName='';
        this.commentComment='';
        this.commentEmail='';
        this.commentWebsite='';
        if(this.toaster) return;
        this.toaster = this.toastController.create({
          message: 'Your comment has been posted successfully.' ,
          duration: 3000,
          position: 'top'
        });
        this.toaster.onDidDismiss(()=>{
          this.toaster = null;
        });
        this.toaster.present();
      }).catch(e=>{
        console.log(e);
        errf('Sorry, an error occured, please retry.' );
      });
    }

    if(err){
      errf(err);
    }
  }

  presentCommentsModal() {
    let profileModal = this.modalCtrl.create(CommentsComponent, { topic: this.selectedTopic });
    profileModal.present();
  }

  private subscribeToNetworkConnectionChanges() {
    if (this.platform.is('cordova')) {
      this.networkConnectionChangeSubscription = this.networkProvider.networkConnectionChanged.subscribe((newConnectionType) => {
        this.isConnectedToWiFi = newConnectionType === 'wifi';
      });
    }
  }

  private unsubscribeFromNetworkConnectionChanges() {
    if (this.platform.is('cordova')) {
      this.networkConnectionChangeSubscription.unsubscribe();
    }
  }
}
