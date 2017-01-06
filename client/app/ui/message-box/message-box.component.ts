import {
	Injector,
	NgZone,
	Component,
	OnInit,
	OnDestroy,
	ElementRef,
	ViewEncapsulation
} from '@angular/core';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';

import 'rxjs/add/operator/map';
import {Subscription, Observable, ReplaySubject} from 'rxjs/Rx';
import {BaseComponent} from '../../common/base-component';
import {ContentComponent} from '../window/window.model';
import * as Model from './message-box.model';

class ButtonVisibility {
	ok: boolean;
	yes: boolean;
	no: boolean;
	cancel: boolean;
}

@Component({
	selector: 'message-box-component',
	templateUrl: 'message-box.component.html',
	providers: [],
	encapsulation: ViewEncapsulation.None,
	host: {
		'class': 'message-box-component'
	}
})

export class MessageBoxComponent extends BaseComponent implements OnInit, OnDestroy, ContentComponent {

	public buttons: ButtonVisibility;
	public message: SafeHtml;

	private _model: Model.MessageBoxModel;
	private _closeHandler: (result: any) => void;

	constructor(injector: Injector, private _sanitizer: DomSanitizer, private _element: ElementRef) {
		super(injector);
		this.buttons = new ButtonVisibility();
	}

	ngOnInit() {
	}

	ngOnDestroy() {
	}

	public initialize(model: any, closeCallback: (result: any) => void) {
		this._model = model;
		this._closeHandler = closeCallback;
		this.initializeView();
	}

	closeRequest(): boolean {
		return true;
	}

	get windowTitle(): string {
		return this._model ? this._model.title : '';
	}

	ok(item) {
		if (this._closeHandler)
			this._closeHandler(Model.ResultType.Ok);
	}

	yes(item) {
		if (this._closeHandler)
			this._closeHandler(Model.ResultType.Yes);
	}

	no(item) {
		if (this._closeHandler)
			this._closeHandler(Model.ResultType.No);
	}

	cancel(item) {
		if (this._closeHandler)
			this._closeHandler(Model.ResultType.Cancel);
	}

	private initializeView() {
		if (this._model) {
			this.message = this._sanitizer.bypassSecurityTrustHtml(this._model.message.replace(/\r\n/g, '<br>'));
			switch (this._model.type) {
				case Model.MessageType.Ok:
					this.buttons.ok = true;
					break;
				case Model.MessageType.OkCancel:
					this.buttons.ok = true;
					this.buttons.cancel = true;
					break;
				case Model.MessageType.YesNo:
					this.buttons.yes = true;
					this.buttons.no = true;
					break;
				case Model.MessageType.YesNoCancel:
					this.buttons.yes = true;
					this.buttons.no = true;
					this.buttons.cancel = true;
					break;
			}
		}
	}
}