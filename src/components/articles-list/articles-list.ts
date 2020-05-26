import {Component, Input,Output,EventEmitter} from '@angular/core';
import {NavController, App} from "ionic-angular";
import {TopicsProvider} from "../../providers/topics/topics";
import {NetworkProvider} from "../../providers/network/network";
import {Subscription} from "rxjs/Subscription";
import {Platform} from 'ionic-angular';
import {ImageLoadOptionProvider} from "../../providers/image-load-option/image-load-option";
import {TranslateService} from "@ngx-translate/core";
import { ApplicationSettingsProvider } from '../../providers/applicationSettings/applicationSettings';

/**
 * Generated class for the ArticlesListComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'articles-list',
  templateUrl: 'articles-list.html'
})
export class ArticlesListComponent {

  @Input('articles') articles: Array<{}>;
  @Input('category') category: {};
  @Input('selectedCategoryDefaultImage') selectedCategoryDefaultImage: string;
  @Input('selectedCategoryForUppercase') selectedCategoryForUppercase: string;
  @Input('isSearch') isSearch: boolean = false;
  @Input('searchToken') searchToken: string = '';
  @Input('forcedCategoryTitle') forcedCategoryTitle: string;
  @Output('loadAnother') infiniteEventEmitter = new EventEmitter<any>();
  @Input('partial') partial = false;
  @Input('onlyModel') onlyModel = false;

  allCategory = this.settingsProvider.allCategory;

  public selectedImgLoadOption: string;
  private networkConnectionChangeSubscription: Subscription;
  private isConnectedToWiFi: boolean = false;

  constructor(public navCtrl: NavController,
    private appCtrl: App,
    protected topicsProvider: TopicsProvider,
    protected imgLoadProvider: ImageLoadOptionProvider,
    protected networkProvider: NetworkProvider,
    protected translate: TranslateService,private settingsProvider: ApplicationSettingsProvider,
    protected platform: Platform) {}

  public selectTopicAndDisplaySummary(topic: any) {
    if(this.onlyModel){
      this.topicsProvider.setSelectedTopic(this.category,topic);
      return;
    }
    let category = !this.isSearch && this.category ? this.category : topic._category;
    this.appCtrl.getRootNav().push('SummaryPage', {
      isSearch: this.isSearch,
      forcedCategoryTitle: this.forcedCategoryTitle,
      category:category,
    });

    this.topicsProvider.setSelectedTopic(category, topic);
  }

  public guessUnique(article){
    if(!('uniqueSortOf' in article)) article.uniqueSortOf = ((num) => {
      for(let i = 2, s = Math.sqrt(num); i <= s; i++)
          if(num % i === 0) return false; 
      return num > 1;
  })( Math.floor(Math.random() * Math.floor(Math.pow(this.articles.indexOf(article)+1,2)%15) + 4 ));
    return article.uniqueSortOf;
  }

  public getImageUrl(article){
    //console.log('article imageUrl: ', article,article.imageUrls , this.selectedCategoryDefaultImage );
    return ( article.imageUrls.length > 0 && (this.isConnectedToWiFi || (this.selectedImgLoadOption === 'all') )
        && article.imageUrls[0] ) || this.selectedCategoryDefaultImage;
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      // initialize variable because we may not have an update from observable
      this.isConnectedToWiFi = this.networkProvider.network.type === 'wifi';
      if (this.platform.is('cordova')) {
        this.networkConnectionChangeSubscription = this.networkProvider.networkConnectionChanged.subscribe((newConnectionType) => {
          this.isConnectedToWiFi = newConnectionType === 'wifi';
        });
      }
    });
  }

  ngOnChanges() {
    this.selectedImgLoadOption = this.imgLoadProvider.getSelectedImageLoadOption();
    // if variable wasn't already set, get the value from storage
    if (!this.selectedImgLoadOption)
      this.imgLoadProvider.getSelectedImageLoadOptionFromStorage().then((newOption) => {
        this.selectedImgLoadOption = newOption;
      });
  }

  ngOnDestroy() {
    if (this.platform.is('cordova')) {
      this.networkConnectionChangeSubscription.unsubscribe();
    }
  }

  doInfinite(e){
    this.infiniteEventEmitter.emit(e);
  }
  trackById(index, article) {
    return article.id;
  }

  goToAdvert() {
    //this.ga.trackView("Privacy policy page");
    const url = "https://www.ubagroup.com/countries/ng/personalbanking/eproducts/mobile-banking";
    window.open(url, 'location=yes');
  }
}

