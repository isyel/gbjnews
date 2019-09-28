import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {SummaryPage} from "./summary";
import {ComponentsModule} from "../../components/components.module";
import {TranslateModule} from "@ngx-translate/core";
import {translationServiceConfig} from "../../app/translation-module-config";
import {PipesModule} from "../../pipes/pipes.module";

@NgModule({
  declarations: [SummaryPage],
  imports: [IonicPageModule.forChild(SummaryPage),
    ComponentsModule,
    PipesModule,
    TranslateModule.forChild(translationServiceConfig)],
})
export class SummaryPageModule { }
