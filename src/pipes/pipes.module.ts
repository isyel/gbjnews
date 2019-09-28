import { NgModule } from '@angular/core';
import { SafeHtmlPipe } from './safe-html/safe-html';
import { HighlightifyPipe } from './highlightify/highlightify';
@NgModule({
	declarations: [SafeHtmlPipe,
    HighlightifyPipe],
	imports: [],
	exports: [SafeHtmlPipe,
    HighlightifyPipe]
})
export class PipesModule {}
