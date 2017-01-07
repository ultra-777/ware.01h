import {
	Component,
	OnInit,
	OnDestroy,
	ViewEncapsulation,
	Injector
} from '@angular/core';
import * as Message from '../../ui/message-box/index';
import { ConfigurationService } from '../../common/configuration/configuration.service';
import { BaseComponent } from '../../common/base-component';


@Component({
	selector: 'default-view',
	templateUrl: 'default-view.component.html',
	providers: [ ConfigurationService ],
	encapsulation: ViewEncapsulation.None,
	host: {
		'class': 'default-view-component'
	}
})
export class DefaultViewComponent extends BaseComponent implements OnInit, OnDestroy {

	isLoading: boolean;
	preloaderTitle: string = 'Waiting for something ...';

	constructor (injector: Injector, private _message: Message.MessageBoxService) {
		super(injector);
	}

	ngOnInit(): void {
	}

	ngOnDestroy(): void {

	}

	onMessageBoxClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this._message.showOk('Cheers...', 'qwerty');
	}

	onPreloaderClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		let self = this;
		self.isLoading = true;
		// setTimeout(() => self.isLoading = false, 5000);
	}
}