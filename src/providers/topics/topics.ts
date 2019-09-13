import {Injectable} from '@angular/core';
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs";
import {ApplicationSettingsProvider} from "../applicationSettings/applicationSettings";
import {TopicsUpdatedInfo} from "../../models/TopicsUpdatedInfo";
import {ApiServiceProvider} from "../api-service/apiService";
import {SelectTopicEnum} from "../../models/selectTopicEnum";


@Injectable()
export class TopicsProvider {

  private topics: Array<{}> = [];

  // equate to default category which is actually first, to avoid undefined error in somepart of the application.
  private category: {} = this.applicationSettings.allCategory;
  private topicsByKeyword: Array<{}>;
  private getOnlyHotTopics: boolean;

  public reloadRequired: Subject<any>;
  public categoryUpdated: Subject<any>;
  public topicsUpdated: Subject<any>;
  public selectedTopicUpdated: BehaviorSubject<any>;

  private static DAY_IN_MILLIS: number = 24 * 60 * 60 * 1000;

  constructor(private serviceClient: ApiServiceProvider,
              private applicationSettings: ApplicationSettingsProvider,) {
    this.topicsUpdated = new Subject<any>();
    this.reloadRequired = new Subject<any>();
    this.categoryUpdated = new Subject<any>();
    this.getOnlyHotTopics = true; //todo :load from local storage
    this.selectedTopicUpdated = new BehaviorSubject<any>(null);
  }

  public refreshTopics(category: {},continuation:boolean = false): Promise<any> {

    let refreshPromise = new Promise((resolve,reject) => {
      this.applicationSettings.getApplicationSettings()
        .then((applicationSettings) => {

          if(!continuation) this.topics = [];

          this.serviceClient
            .getTopics(category,1,this.topics.length,applicationSettings.language)
            .then((topics) => {

              if(!topics) topics = [];
              topics = this.preprocessTopics(topics);
              this.formatDateAndTimeForTopics(topics);
              this.orderTopicsChronologically(topics);
              let prevTopics = this.topics;
              this.topics = continuation ? this.topics.concat(topics) : topics;

              this.category = category;

              //get topics by taking into account the filters
              let topicsToDisplay = this.getTopics();
              let topicsUpdatedInfo = new TopicsUpdatedInfo(category, topicsToDisplay, this.topics.length ,
              continuation ? this.topics.length > prevTopics.length :this.topics.length > 0,continuation);
              this.topicsUpdated.next(topicsUpdatedInfo);
              resolve(topicsUpdatedInfo);
            }).catch(e=>{
              reject(e);
            });
        }).catch(e=>{
          reject(e);
        });
    });
    return refreshPromise;
  }

  public preprocessTopics<T>(topics:T|any):T{

    // preprocess topic.
    topics.forEach((t:T|any)=>{
      t = this.serviceClient.preprocessTopic(t);
    });
    return topics;
  }

  public getTopics(): Array<any> {
    if (this.getOnlyHotTopics)
      return this.filterHotTopics();
    else {
      return this.topics.slice(0);
    }
  }

  public getCategory():{} {
    return this.category;
  }
  public setCategory(category:{}) {
    this.category = category;
  }

  public getTopicsByKeyword(keyword: string,page:number,offset:number = undefined) {
    return new Promise((resolve,reject) => {
      this.applicationSettings.getApplicationSettings()
        .then((applicationSettings) => {
          this.serviceClient.getTopicsByKeyword(null,keyword,page,offset, applicationSettings.language)
          .then((topics)=>{
            this.topicsByKeyword = this.preprocessTopics(topics);
            this.formatDateAndTimeForTopics(this.topicsByKeyword);
            resolve(this.topicsByKeyword);
          }).catch(e=>{
            reject(e);
          });
        }).catch(e=>{
          reject(e);
        });
    });
  }

  public setTopicFilter(getOnlyHotTopics: boolean) {
    //set to local storage for later use;
    this.getOnlyHotTopics = getOnlyHotTopics;
  }

  public setSelectedTopic(category:{}, topic: any) {
    this.selectedTopicUpdated.next(null);
    let f = ()=>{this.selectedTopicUpdated.next({category: category, topic: topic});};
    window.setTimeout(f,2);
    //f();
  }

  private getPreviousCategory(currentCateg:{}): Promise<any> {
    return new Promise((resolve) => {
      this.applicationSettings.getApplicationSettings()
        .then((applicationSettings) => {
          let index = applicationSettings.categories.map((x:any) => x.id).indexOf(currentCateg['id']); //find the index if the current category
          if (index == 0)
            resolve(true?this.applicationSettings.allCategory:applicationSettings.categories[applicationSettings.categories.length - 1]);
          else if (index >= 0&&index < applicationSettings.categories.length)
            resolve(applicationSettings.categories[index - 1]); //get the previous one
          else
            resolve(true ? (applicationSettings.categories.length > 0 ? applicationSettings.categories[applicationSettings.categories.length-1] :
              this.applicationSettings.allCategory) : null); //categ was not found in the array...now thats strange!
        });
    })
  }

  private getNextCategory(currentCateg:{}): Promise<any> {
    return new Promise((resolve) => {
        this.applicationSettings.getApplicationSettings()
          .then((applicationSettings) => {
            let index = applicationSettings.categories.map((x:any) => x.id).indexOf(currentCateg['id']); //find the index if the current category
            if (applicationSettings.categories.length > 0 && index == applicationSettings.categories.length - 1) //current category is the last one.
              resolve(true?this.applicationSettings.allCategory:applicationSettings.categories[0]); //fetch the first one
            else if (index >= 0 && index <= applicationSettings.categories.length - 1)
              resolve(applicationSettings.categories[index + 1]); //fetch next category
            else
              resolve(true ? (applicationSettings.categories.length > 0 ? applicationSettings.categories[0] :
                this.applicationSettings.allCategory) : null);
          });
      }
    )
  }

  private getTopicsAndSelect(category:{}, topicToSelect: SelectTopicEnum) {
    if (category) {
      let topicToSelectAfterRetrieval = topicToSelect;
      this.refreshTopics(category)
        .then((topicsUpdatedInfo: TopicsUpdatedInfo) => {
          if (topicsUpdatedInfo.topics && topicsUpdatedInfo.topics.length > 0) {
            let topicToSelect = topicToSelectAfterRetrieval == SelectTopicEnum.FIRST ?
              topicsUpdatedInfo.topics[0] : topicsUpdatedInfo.topics[topicsUpdatedInfo.topics.length - 1];
            this.setSelectedTopic(topicsUpdatedInfo.category, topicToSelect);
          } else {
            if (topicToSelectAfterRetrieval === SelectTopicEnum.FIRST)
              this.loadNextTopic(category, null, false, true);
            else
              this.loadPreviousTopic(category, null, false, true);
          }
        });
    }
  }

  public loadNextTopic(category: {}, currentTopic: {}, isSearch: boolean, shouldForceNextCategory: boolean = false) {
    let existingTopics = isSearch ? this.topicsByKeyword : this.getTopics();
    let index = currentTopic ? existingTopics.map(x => x.id).indexOf(currentTopic['id']) : -1;
    //we have reached the end or should force the next category selection
    if (index == existingTopics.length - 1 || shouldForceNextCategory) {
      if (!isSearch) //for search results there is no next/previous category to navigate
        this.getNextCategory(category)
          .then((nextCategory) => {
            this.applicationSettings.getApplicationSettings().then(applicationSettings=>{
              let index = applicationSettings.categories.map((x:any)=>x.id).indexOf(nextCategory['id']) + 1;
              this.getTopicsAndSelect(nextCategory, SelectTopicEnum.FIRST);
              this.categoryUpdated.next( index );
            });
          });
    }
    else
      this.setSelectedTopic(category, existingTopics[index + 1]);
  }

  public loadPreviousTopic(category: {}, currentTopic: {}, isSearch: boolean, shouldForcePreviousCategory: boolean = false) {
    let existingTopics = isSearch ? this.topicsByKeyword : this.getTopics();
    let index = currentTopic ? existingTopics.map(x => x.id).indexOf(currentTopic['id']) : -1;
    //we have reached the start or should force the previous category selection
    if (index == 0 || shouldForcePreviousCategory) {
      if (!isSearch)
        this.getPreviousCategory(category)
          .then((previousCateg) => {

            this.applicationSettings.getApplicationSettings().then(applicationSettings=>{
              let index = applicationSettings.categories.map((x:any)=>x.id).indexOf(previousCateg['id']) + 1;
              this.getTopicsAndSelect(previousCateg, SelectTopicEnum.LAST);
              this.categoryUpdated.next( index );
            });
          });
    }
    else
      this.setSelectedTopic(category, existingTopics[index - 1]);
  }

  private filterHotTopics(): Array<{}> {
    let topicsCopy = this.topics.slice(0);
    topicsCopy = topicsCopy
	.filter((topic) => topic['FromArticles'] > 1)
	.sort((a: any, b: any): number => {
		// sorting with DESC order
		if (a.FromArticles < b.FromArticles)
		return 1;
		else if (a.FromArticles > b.FromArticles)
		return -1;
		return 0;
	});
    return topicsCopy.slice(0);
  }

  private formatDateAndTimeForTopics(topics: Array<any>) {
    let now: Date = new Date();
    now.setHours(0, 0, 0, 0);
    let nowDateFormatted = (now.getDate() < 10 ? '0' : '') + now.getDate() + '-' +
      ((now.getMonth() + 1) < 10 ? '0' : '') + (now.getMonth() + 1) + '-' + now.getFullYear();
    topics.map((t:Date|any) => {

      let newestDate: any = t.NewestDate;
      let b = true;
      if(b){
        t.DisplayTime = newestDate.toDateString();
      }
      else{
        t.DateFormatted = (newestDate.getDate() < 10 ? '0' : '') + newestDate.getDate() + '-' +
          ((newestDate.getMonth() + 1) < 10 ? '0' : '') + (newestDate.getMonth() + 1) + '-' + newestDate.getFullYear();
        t.TimeFormatted = (newestDate.getHours() < 10 ? '0' : '') + newestDate.getHours() + ':' +
          (newestDate.getMinutes() < 10 ? '0' : '') + newestDate.getMinutes();
        t.Date = new Date(Date.UTC(newestDate.getFullYear(), newestDate.getMonth(), newestDate.getDate(),
          newestDate.getHours(), newestDate.getMinutes(), newestDate.getSeconds()));
        if (nowDateFormatted === t.DateFormatted)
          t.DisplayTime = t.TimeFormatted;
        else if (t.Date.getTime() > now.getTime() - (TopicsProvider.DAY_IN_MILLIS))
          t.DisplayTime = 'YESTERDAY';
        else
          t.DaysAgo = parseInt((((now.getTime() - t.Date.getTime()) / (TopicsProvider.DAY_IN_MILLIS)) + 1).toString());
      }
      return t;
    });
  }

  private orderTopicsChronologically(topics: Array<any>) {
    // sorting with DESC order
    topics.sort((a: any, b: any): number => {
      let dateA: Date = a.Date;
      let dateB: Date = b.Date;
      if (dateB > dateA) {
        return 1;
      } else if (dateB < dateA) {
        return -1;
      }
      return 0;
    });
  }
}
