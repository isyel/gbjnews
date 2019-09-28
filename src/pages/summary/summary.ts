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
import { Storage } from '@ionic/storage';
import { TextManipulationService } from '../../lib/text-manipulation';
import { ApplicationSettingsProvider } from '../../providers/applicationSettings/applicationSettings';
import { ApplicationSettings } from '../../models/applicationSettings';

@IonicPage()
@Component({
  selector: 'page-summary',
  templateUrl: 'summary.html',
})
export class SummaryPage {
  @ViewChild(Content) content: Content;

  public someTopics:Array<{}> = [];
  public maxSomeTopics = 3;

  public selectedCategory: {};
  public selectedCategoryDefaultImage: string;
  public selectedCategoryForUppercase:string;
  public selectedTopic: any;
  public selectedImage:string;
  public isSearch: boolean;
  public isConnectedToWiFi: boolean = false;
  
  comments:Array<{}> = [];
  maxComment = 3;

  commentComment = '';
  user:any={};

  public topicUpdatedSubscription: Subscription;
  private networkConnectionChangeSubscription: Subscription;
  private progressVisible = true;

  allCategory = this.settingsProvider.allCategory;

  constructor(public modalCtrl: ModalController,private navParams: NavParams,
              private socialSharing: SocialSharing,
              private topicsProvider: TopicsProvider,
              private imgLoadProvider: ImageLoadOptionProvider,
              private settingsProvider: ApplicationSettingsProvider,
              private networkProvider: NetworkProvider,
              private loader: LoaderProvider,
              private toastController:ToastController,
              private platform: Platform,
              private storage:Storage,
              private wpV2ApiCaller :WpV2ApiCaller) {
  }

  ionViewDidLoad() {
    this.progressVisible = true;
    this.subscribeToChanges();
  }

  private toaster = null;
  ionViewDidEnter() {
    // initialize variable because we may not have an update from observable
    this.isConnectedToWiFi = this.networkProvider.network.type === 'wifi';
    this.subscribeToNetworkConnectionChanges();
    this.initPage();
    this.toaster = null;
    this.storage.get('app-user').then((user)=>{
      this.user = user||{};
    });
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
        console.log('summary subscribeToChanges:',data);

        this.progressVisible = false;
        this.content.scrollToTop();

        this.selectedCategory = data.category;
        this.selectedTopic = data.topic;
        this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage(data.category);
        this.selectedCategoryForUppercase = TextManipulationService.getUppercaseFriendlyText(this.selectedCategory['name']);
        let selectedImgLoadOption = this.imgLoadProvider.getSelectedImageLoadOption();
        this.selectedImage = this.selectedTopic.imageUrls.length > 0
        && (this.isConnectedToWiFi || selectedImgLoadOption === 'all') ?
        this.selectedTopic.imageUrls[0] : this.selectedCategoryDefaultImage;
        //this.ga.trackView("Summary: " + this.selectedTopic.Title);

        this.comments = [];
        this.wpV2ApiCaller.getComments( this.selectedTopic , {params:{per_page:this.maxComment}} ).then( (comments)=>{
          this.comments = comments;
        } ).catch((e)=>{
          // comments could not be loaded
          this.toaster = this.toastController.create({
            message: 'could not load comment' ,
            duration: 2000,
            position: 'bottom'
          });
          this.toaster.present();
        });

        if(!this.isSearch ){
          // related topics
          this.someTopics = [];
          const allTopics = this.topicsProvider.getTopics(this.selectedCategory);
          if(allTopics.length>1){

            const amountToTake = Math.min(allTopics.length-1,this.maxSomeTopics);
            
            let ix = allTopics.findIndex((topic)=>{
              return topic.id == this.selectedTopic.id;
            });
            ix = Math.max(ix - Math.floor(amountToTake/2),0);
  
            for( let i = 0,j=0 ; i < allTopics.length && j < amountToTake ; i++ ){
              const topic = allTopics[( ix + i ) %allTopics.length];
              if(topic.id!=this.selectedTopic.id){
                this.someTopics.push(topic);
                j++;
              }
            }
          }
        }
      }
    });
  }

  unsubscribeToChanges() {
    this.topicUpdatedSubscription.unsubscribe();
  }

  initPage() {
    this.isSearch = this.navParams.get('isSearch');
    this.selectedCategory = this.navParams.get('category');
    if (this.isSearch) {
      //this.selectedCategory = this.navParams.get('forcedCategoryTitle');
      this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage('Search');
    } else {
      this.selectedCategoryDefaultImage = CategoriesViewManager.getCategoryDefaultImage(this.selectedCategory);
    }
  }

  swipeActivity(event) {

    this.progressVisible = true;

    const f=()=>{
      this.progressVisible = false;
      let toaster = this.toastController.create({
        message: 'No more resource.',
        duration: 2000,
        position: 'top'
      });
      toaster.present();
    };

    if (event.direction == 2){
      if(!this.topicsProvider.loadNextTopic(this.selectedCategory, this.selectedTopic, this.isSearch)){
        f();
      }
    }
    else if (event.direction == 4)
      if(!this.topicsProvider.loadPreviousTopic(this.selectedCategory, this.selectedTopic, this.isSearch)){
        f();
      }
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
    if(!this.user.commentName) err="Please enter a valid name";
    else if(!this.user.commentEmail) err="Please enter a valid email address";
    else if(!this.commentComment) err="Please type your comment";
    else{
      this.loader.showLoader();
      this.wpV2ApiCaller.postComment( this.selectedTopic, this.user.commentName,this.user.commentEmail,this.commentComment,this.user.commentWebsite )
      .then(()=>{
        this.storage.set('app-user',this.user);
        this.commentComment='';
        this.loader.hideLoader();
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
        this.loader.hideLoader();
        console.log(e);
        errf('Sorry, an error occured, please retry.' );
      });
    }

    if(err){
      errf(err);
    }
  }

  presentCommentsModal() {
    this.settingsProvider.getApplicationSettings().then((applicationSettings: ApplicationSettings) => {
      let profileModal = this.modalCtrl.create(CommentsComponent, { topic: this.selectedTopic },{
        cssClass:`theme-container ${applicationSettings.activeTheme.toLowerCase()}-theme`,
      });
      profileModal.present(); 
    });
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
