import { Pipe, PipeTransform } from '@angular/core';

/**
 * Generated class for the HighlightifyPipe pipe.
 *
 * See https://angular.io/api/core/Pipe for more info on Angular Pipes.
 */
@Pipe({
  name: 'highlightify',
})
export class HighlightifyPipe implements PipeTransform {
  /**
   * Takes a value and makes it lowercase.
   */
  transform(value: string, search:string,cssClass='highlight',multi:boolean = false) {
    let text = value;
    if (text && search) {
      text = text.toString(); // sometimes comes in as number

      let searches = multi ? search.split(' ') : [search];
      searches.forEach((search)=>{
        search = search.trim();
        if (search.length > 0) {
            let pattern = search.trim().replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            pattern = pattern.split(' ').filter((t) => {
                return t.length > 0;
            }).join('|');
            let regex = new RegExp(pattern, 'gi');
  
            text = text.replace(regex, (match) => `<span class="${cssClass}">${match}</span>`);
        }
      });
    }
    return text;
  }
}
