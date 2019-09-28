import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { AnchorComponent } from './anchor/anchor';
import { CommonModule } from '@angular/common';
import { ArticlesListComponent } from './articles-list/articles-list';
import {NetworkProvider} from "../providers/network/network";
import {TranslateModule} from "@ngx-translate/core";
import {PipesModule} from "../pipes/pipes.module";
import { CommentsComponent } from './comments/comments';
import { LineProgressBarComponent } from './line-progress-bar/line-progress-bar';

@NgModule({
	declarations: [AnchorComponent,
    ArticlesListComponent,
    CommentsComponent,
    LineProgressBarComponent,
    ],
	imports: [PipesModule,CommonModule, IonicModule, TranslateModule],
	exports: [AnchorComponent,
    ArticlesListComponent,
    CommentsComponent,
    LineProgressBarComponent,
    ],
    entryComponents:[CommentsComponent],
	providers: [NetworkProvider]
})

export class ComponentsModule {}
