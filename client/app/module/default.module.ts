import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule }	from '@angular/forms';
import { RouterModule, Routes} from '@angular/router';
import { HttpModule } from '@angular/http';
import 'rxjs/add/operator/map';

import { ConfigurationService } from '../common/configuration/configuration.service';
import { RootComponent } from '../component/root/root.component';
import { ConfigResolver } from '../common/configuration/config.resolver';
import { RootExceptionHandler } from '../root-exception-handler';

import * as Modal from '../ui/window/index';
import * as MessageBox from '../ui/message-box/index';
import * as Preloader from '../ui/preloader/index';
import * as DefaultView from '../component/default-view/index';



const appRoutes: Routes = [
    /*
    { path: 'portal/:mode', component: PortalComponent, resolve: { config: ConfigResolver } },
    */
	{ path: '', component: DefaultView.DefaultViewComponent, resolve: { config: ConfigResolver } },
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
		Modal.DECLARATION,
		MessageBox.DECLARATION
	],
	providers: [
		ConfigurationService,
		ConfigResolver,
		{ provide: ErrorHandler, useClass: RootExceptionHandler },
		Modal.PROVIDER,
		DefaultView.PROVIDER,
		MessageBox.PROVIDER
	],
	declarations: [
		RootComponent,
		Modal.DECLARATION,
		DefaultView.DECLARATION,
		MessageBox.DECLARATION,
		Preloader.DECLARATION
	],
	bootstrap: [ RootComponent ]
})
export class RootModule {
	constructor() {
		ConfigurationService.refresh();
	}
}