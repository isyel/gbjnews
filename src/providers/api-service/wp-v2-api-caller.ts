import { Injectable,InjectionToken,Inject} from '@angular/core';

import {Observable} from "rxjs";

import {HttpClient} from "@angular/common/http";

export const WP_ENDPOINT_URL_TOKEN = new InjectionToken<String>('WP_ENDPOINT_URL_TOKEN');

@Injectable()
export class WpV2ApiCaller{

	constructor( @Inject(WP_ENDPOINT_URL_TOKEN) private apiEndpoint, private http:HttpClient ) {
	}
	
	private get(url,headers?) :Promise<any>{
		return this.http.get(this.apiEndpoint + url,headers).catch((e:any)=>{
			return Observable.throw(console.error(e));
		}).toPromise();
	}
	private post(url,data={},options?) :Promise<any>{
		return this.http.post(this.apiEndpoint + url, data,options).toPromise();
	}

	public postComment( post:{},name,email,comment,website='',options? ){
		return this.post('wp/v2/comments',{
			post:post['id'],
			author_name:name,
			author_email: email,
			author_url: website,
			content:comment,
			author_user_agent:'Ionic2',
		},options );
	}

	public getComments( post:{},options ={} ){
		let url = 'wp/v2/comments';
		if( !( 'params' in options) ) options['params'] = {};
		options['params']['post'] = post['id'];
		return this.get(url,options );
	}

	public getComment( id:string,options? ){
		let url = 'wp/v2/comments';
		if( id ){
			url += '/' + id;
		}
		return this.get(url,options );
	}
	public getCategories(headers?):Promise<Array<{}>>{
		return this.get( 'wp/v2/categories',headers );
	}

	public getPosts( id?:string , headers? ):Promise<Array<{}>>{
		let url = 'wp/v2/posts';
		if( id ){
			url += '/' + id;
		}
		return this.get( url , headers );
	}

	public getPost( id:string,headers? ):Promise<{}>{
		return this.getPosts(id,headers);
	}
}
