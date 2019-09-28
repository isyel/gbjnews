import {Component, Input} from '@angular/core';

/**
 * Generated class for the AnchorComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'anchor',
  templateUrl: 'anchor.html'
})
export class AnchorComponent {

  @Input('href') href: string;
  @Input('text') text: string;
  constructor() {

  }

  openLink(){
    window.open(this.href, 'location=yes');
  }

}
