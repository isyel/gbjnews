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

    let text:string|Array<any> = value;
    if (text && search) {

      // sometimes comes in as number
      text = text.toString();

      text = text.split(/(\s+)/).filter(t=>t.trim().length > 0 ).map( t => {
        return { processed:false , text:t, };
      });

      let searches = multi ? search.split(/(\s+)/) : [search];

      ((arr) => {
        var b = {};
        for (var i=0; i<arr.length; i++) { b[arr[i].toUpperCase()]=arr[i].toLowerCase(); }
        var c = [];
        for (var key in b) { c.push(b[key]); }
        return c;
      })(searches.filter( t => t.trim().length > 0 ).sort((a, b)=> b.length - a.length)).forEach((search)=>{

        search = search.trim();
        if (search.length > 0) {

          const b = false;
          if(b){
            (text as Array<any>).forEach((t)=>{
              if(!t.processed&&t.text.toLowerCase()==search.toLowerCase()){
                t.processed = true;
                t.text = `<span class="${cssClass}">${search}</span>`;
              }
            });
          }
          else{

            let pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");

            // later find out, i wonder what this is doing
            pattern = pattern.split(/(\s+)/).filter( t => t.trim().length > 0 ).join('|');

            let regex = new RegExp(pattern, 'gi');

            (text as Array<any>).forEach((t)=>{
              if(!t.processed) t.text = t.text.replace(regex, (match) => { t.processed = true; return `<span class="${cssClass}">${match}</span>`;});
            });
          }

          //console.log('pattern',search,text);
        }
      });
      text = text.reduce((s,v)=> s + v.text + ' ','' );
    }
    return text;
  }
}
