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
	providers: [ConfigurationService],
	encapsulation: ViewEncapsulation.None
})
export class DefaultViewComponent extends BaseComponent implements OnInit, OnDestroy {

	constructor (injector: Injector, private _message: Message.MessageBoxService) {
		super(injector);
	}

	ngOnInit(): void {
	}

	ngOnDestroy(): void {

	}

	onClick(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this._message.showOk('Cheers...', 'qwerty');
	}
}