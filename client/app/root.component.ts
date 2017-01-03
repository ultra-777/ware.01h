import {
	Injector,
	Component,
	OnInit,
	OnDestroy,
	ViewEncapsulation
} from '@angular/core';
import {BaseComponent} from './common/base-component';
import {ConfigurationService} from  './common/configuration/configuration.service';

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
		private _config: ConfigurationService
	) {
		super(injector);
		_config.settings$.subscribe(settings => {
			// ;
		});
	}

	ngOnInit() {
	}

	ngOnDestroy() {

	}
}