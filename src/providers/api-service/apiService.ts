import {Injectable} from '@angular/core';

import {WpV2ApiCaller} from "../../providers/api-service/wp-v2-api-caller";



/*
 Generated class for the ApiServiceProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class ApiServiceProvider {

  private post_per_page = 5;
  private categories_per_page = 100;

  constructor(private wpV2ApiCaller :WpV2ApiCaller) {
  }

  public preprocessTopic(t){

    // fix.
    t.NewestDate = new Date(t.date);
    t.imageUrls=[];
    if( typeof t['_embedded']['wp:featuredmedia'] != 'undefined' ) t.imageUrls.push(t['_embedded']['wp:featuredmedia'][0].source_url);

    if(typeof t['_embedded']['wp:term'] != 'undefined'){
      let pack = t['_embedded']['wp:term'][0] ;
      t._category = pack[pack.length-1];
    }

    return t;
  }

  public getLanguages(): Array<string> {
    return null;
    //return this.soapApiCaller.getResource('getLanguages', null);
  }

  public getCategories(selectedLang: string): Promise<Array<{}>> {
    return this.wpV2ApiCaller.getCategories( { params : { _embed:undefined,per_page : this.categories_per_page } } );
  }

  public getTopics(selectedCategory: {},page:number,offset:number = undefined, selectedLang: string,param = {}): Promise<Array<{}>> {
    return this.wpV2ApiCaller.getPosts(null, { params : (Object.assign({_embed:undefined,page:page,per_page:this.post_per_page
    }, ( selectedCategory && 'id' in selectedCategory && selectedCategory['id'] ? {categories:selectedCategory['id']} : {}) ,
    offset ? {offset} : {}, param ) ) } );
  }

  public getTopicsByKeyword(selectedCategory: {},keyword: string,page:number = 1,offset:number = undefined, selectedLang: string): 
  Promise<Array<{}>> {
    return this.getTopics( selectedCategory , page ,offset, selectedLang ,{search:keyword} );
  }

  public getSummary(topicId: string, selectedLang: string): Promise<{}> {
    return this.wpV2ApiCaller.getPost(topicId);
  }
}
