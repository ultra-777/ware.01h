import {
	Injector,
	Component,
	OnInit,
	OnDestroy,
	ViewEncapsulation,
	ViewContainerRef
} from '@angular/core';
import { BaseComponent } from '../../common/base-component';
import { ConfigurationService } from  '../../common/configuration/configuration.service';
import * as Modal from '../../ui/window/index';

@Component({
	selector: 'root',
	templateUrl: 'root.component.html',
	providers: [
		ConfigurationService
	],
	encapsulation: ViewEncapsulation.None,
	host: {
		'class': 'root'
	}
})

export class RootComponent extends BaseComponent implements OnInit, OnDestroy {

	constructor(
		injector: Injector,
		private _windowService: Modal.WindowService,
		private _viewContainerRef: ViewContainerRef,
		private _config: ConfigurationService
	) {
		super(injector);
		_config.settings$.subscribe(settings => {
			// ;
		});
	}

	ngOnInit() {
		this._windowService.initializeRoot(this._viewContainerRef);
	}

	ngOnDestroy() {

	}
}