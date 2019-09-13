import {Component, Input,Output,EventEmitter} from '@angular/core';
import {NavController} from "ionic-angular";
import {TopicsProvider} from "../../providers/topics/topics";
import {LoaderProvider} from "../../providers/loader/loader";
import {NetworkProvider} from "../../providers/network/network";
import {Subscription} from "rxjs/Subscription";
import {Platform} from 'ionic-angular';
import {ImageLoadOptionProvider} from "../../providers/image-load-option/image-load-option";
import {TranslateService} from "@ngx-translate/core";

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

  public selectedImgLoadOption: string;
  private networkConnectionChangeSubscription: Subscription;
  private isConnectedToWiFi: boolean = false;

  constructor(public navCtrl: NavController,
              protected topicsProvider: TopicsProvider,
              protected imgLoadProvider: ImageLoadOptionProvider,
              protected networkProvider: NetworkProvider,
              protected translate: TranslateService,
              protected platform: Platform,
              protected loader: LoaderProvider) {}

  public selectTopicAndDisplaySummary(topic: any) {
    this.loader.showLoader();
    let category = this.category ? this.category : topic._category;
    this.topicsProvider.setCategory(category);
    this.navCtrl.push('SummaryPage', {
      isSearch: this.isSearch,
      forcedCategoryTitle: this.forcedCategoryTitle
    });

    this.topicsProvider.setSelectedTopic(category, topic);
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

