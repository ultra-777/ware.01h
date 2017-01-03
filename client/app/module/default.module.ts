import { NgModule, ErrorHandler, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule }	from '@angular/forms';
import { RouterModule, Routes} from '@angular/router';
import { HttpModule } from '@angular/http';
import 'rxjs/add/operator/map';

import { ConfigurationService } from '../common/configuration/configuration.service';
import { RootComponent } from '../root.component';
import { ConfigResolver } from '../common/configuration/config.resolver';
import { RootExceptionHandler } from '../root-exception-handler';



const appRoutes: Routes = [
    /*
    { path: 'portal/:mode', component: PortalComponent, resolve: { config: ConfigResolver } },
    */
];


@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		HttpModule,
		RouterModule,
		RouterModule.forRoot(appRoutes)
	],
	entryComponents: [
	],
	providers: [
		ConfigurationService,
		ConfigResolver,
		{ provide: ErrorHandler, useClass: RootExceptionHandler },
	],
	declarations: [
		RootComponent
	],
	bootstrap: [RootComponent]
})
export class RootModule {
	constructor() {
		ConfigurationService.refresh();
	}
}