import { Component, Input } from '@angular/core';

/**
 * Generated class for the LineProgressBarComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'line-progress-bar',
  templateUrl: 'line-progress-bar.html'
})
export class LineProgressBarComponent {

  @Input()
  visible:boolean = false;

  constructor() {
  }

  ngAfterViewInit(){
  }

}
