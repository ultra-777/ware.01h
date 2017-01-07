import { Injector, Component, Input, OnInit, ElementRef, OnDestroy } from '@angular/core';
import { BaseComponent } from '../../common/base-component';
import { Dimensions } from '../../common/dimensions';

@Component({
	selector: 'preloader-component',
	providers: [],
	templateUrl: 'preloader.component.html',
	host: {
		'class': 'preloader-component'
	}
})

export class PreloaderComponent extends BaseComponent implements OnInit, OnDestroy {

	@Input('title')
	public title: string;

	@Input('title-id')
	public titleId: string;

	private _isActive: boolean;
	private _dimensions: Dimensions;

	constructor(injector: Injector, private _element: ElementRef) {
		super(injector);
	}

	ngOnInit() {
		if (this.titleId) {
			this.title = this.language[this.titleId];
		}

		let domElement: HTMLElement = this._element.nativeElement;
		let parent = domElement.parentElement;
		domElement.style.left = parent.offsetLeft + 'px';
		domElement.style.top = parent.offsetTop + 'px';
		domElement.style.width = parent.offsetWidth + 'px';
		domElement.style.height = parent.offsetHeight + 'px';

		this._isActive = true;
		PreloaderComponent.trackChanges(this);
	}

	ngOnDestroy() {
		this._isActive = false;
	}

	private static trackChanges(self: PreloaderComponent) {
		if (!self || !self._isActive) {
			return;
		}

		let domElement: HTMLElement = self._element.nativeElement;
		let parent = domElement.parentElement;

		let dimensions = self._dimensions || new Dimensions();
		dimensions.left = parent.offsetLeft;
		dimensions.top = parent.offsetTop;
		dimensions.width = parent.offsetWidth;
		dimensions.height = parent.offsetHeight;

		if (dimensions.isDirty) {
			domElement.style.left = dimensions.left ? dimensions.left + 'px' : '0';
			domElement.style.top = dimensions.top ? dimensions.top + 'px' : '0';
			domElement.style.width = dimensions.width ? dimensions.width + 'px' : '0';
			domElement.style.height = dimensions.height ? dimensions.height + 'px' : '0';
		}

		dimensions.isDirty = false;
		self._dimensions = dimensions;
		setTimeout(() => PreloaderComponent.trackChanges(self), 50);
	}
}
