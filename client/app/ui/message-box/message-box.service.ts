import {Injectable, NgZone} from '@angular/core';
import {Observable, Subscription} from 'rxjs/Rx';
import {WindowService} from '../window/window.service';
import {MessageBoxComponent} from './message-box.component';
import * as Model from './message-box.model';

@Injectable()
export class MessageBoxService {

	constructor(private _window: WindowService) {
	}

	public showOk(message: string, title?: string) {
		let subscription = this.show(Model.MessageType.Ok, message, title).subscribe(result => {
			if (subscription) {
				subscription.unsubscribe();
				subscription = null;
			}
		});
	}

	public show(type: Model.MessageType, message: string, title?: string): Observable<Model.ResultType> {
		let model = new Model.MessageBoxModel();
		model.type = type;
		model.message = message;
		model.title = title;

		return Observable.create(observer => {
			this._window.openModal<Model.ResultType>(MessageBoxComponent, model).subscribe(result => {
				observer.next(result);
				observer.complete();
			});
		});
	}
}