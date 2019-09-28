import { Component, ViewChild } from '@angular/core';
import {NavController, NavParams,ToastController, Refresher} from 'ionic-angular';

import {WpV2ApiCaller} from "../../providers/api-service/wp-v2-api-caller";
import {LoaderProvider} from "../../providers/loader/loader";

import {CustomErrorHandler} from "../../providers/error/customErrorHandler";

import { ViewController } from 'ionic-angular';
/**
 * Generated class for the CommentsComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'comments',
  templateUrl: 'comments.html'
})
export class CommentsComponent {

  @ViewChild(Refresher) refresher: Refresher;

  comments:Array<{}> = null;

  public per_page = 10;

  private topic:{};
  private progressVisible = true;

  constructor(public viewCtrl: ViewController,private wpV2ApiCaller :WpV2ApiCaller,
    private customErrorHandler:CustomErrorHandler,
    public navCtrl: NavController, public navParams: NavParams,private toastController:ToastController,) {

  }

  private toaster = null;
  ionViewDidEnter() {
    this.refresher.pullMin = 80;
    this.refresher.pullMax = 80 + 60;

    this.topic = this.navParams.get('topic');
    this.progressVisible = true;
    this.getComments(false).then(()=>{this.progressVisible = false;}).catch((err)=>{
      this.progressVisible = false;
      this.customErrorHandler.handleError(err);
    });
    this.toaster = null;
  }

  private async getComments( _continue = false ){

    return new Promise((resolve,reject)=>{
      if(!_continue) this.comments = null;
      this.wpV2ApiCaller.getComments( this.topic , {params:{page:1,offset:!_continue?0:this.comments.length,per_page:this.per_page}} ).then( (comments)=>{
        let prevComments = this.comments||[];
        if(!comments) comments = [];

        comments = _continue ? prevComments.concat(comments) : comments;
        if(_continue && comments.length <= prevComments.length){
          // Tell no other resource.
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
        }

        else this.comments = this.preprocessComments(comments);
        resolve();
      } ).catch((e)=>{
        reject(e);
      });
    });

  }

  public refreshComments(e){
    this.getComments(false).then(()=>{e.complete();}).catch((err)=>{
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

  public loadAnother(e){

    this.getComments(true).then(()=>{e.complete();}).catch((err)=>{
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

  private preprocessComments(comments){
    comments.forEach(comment => {
      comment._date = (new Date(comment['date'])).toDateString();
    });
    return comments;
  }

  public closemodal(){
    this.viewCtrl.dismiss();
  }
  trackById(index, comment) {
    return comment.id;
  }
}
