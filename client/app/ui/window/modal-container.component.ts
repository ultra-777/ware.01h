import {
	Component,
	OnInit,
	AfterViewInit,
	OnDestroy,
	ViewEncapsulation,
	Injector,
	ViewContainerRef,
	ViewChild,
	ElementRef,
	NgZone,
	ComponentFactoryResolver
} from '@angular/core';
import {WindowContainer, ContentComponent} from './window.model';
import {ConfigurationService} from '../../common/configuration/configuration.service';

const FORCE_OFFSET: number = 20;

@Component({
	selector: 'modal-container',
	templateUrl: 'modal-container.component.html',
	providers: [ConfigurationService],
	host: {
		'class': 'modal-container',
		'[style.z-index]': 'zIndex',
		'(window:mousedown)': 'onContainerMouseDown($event)',
		'(window:mouseup)': 'onContainerMouseUp($event)',
		'(window:mousemove)': 'onContainerMouseMove($event)',
		'(contextmenu)': 'onContextMenu($event)'
	},
	encapsulation: ViewEncapsulation.None
})

export class ModalContainerComponent implements WindowContainer, OnInit, OnDestroy, AfterViewInit {

	@ViewChild('visible', { read: ViewContainerRef }) public visibleRef;
	@ViewChild('content', { read: ViewContainerRef }) public contentRef;

	public isDragging = false;
	public left: number;
	public top: number;
	public right: number;
	public bottom: number;
	public zIndex: number;
	public opacity: number;

	private _model: any;
	private _startLocationX: number;
	private _startLocationY: number;
	private _startMouseX: number;
	private _startMouseY: number;
	private _content: ContentComponent;
	private _isInitialized: boolean;
	private _targetType: any;
	private _closeHandler: (result: any) => void;

	private static _minPositionOffset: number = 20;
	private static _zIndex: number = 10000;

	constructor(
		private _element: ElementRef,
		private _factoryResolver: ComponentFactoryResolver,
		private _injector: Injector,
		private _zone: NgZone,
		public configuration: ConfigurationService) {
		this.zIndex = ModalContainerComponent._zIndex++;
	}

	ngOnInit() {
		this.initializeContent();
	}

	ngOnDestroy() {

	}

	ngAfterViewInit() {
		this.recalculateLayout();
	}

	public initialize(model: any, targetType: any, closeCallback: (result: any) => void) {
		this._model = model;
		this._targetType = targetType;
		this._closeHandler = closeCallback;
		this.initializeContent();
	}

	public onClose() {
		if (this._content && this._content.closeRequest) {
			if (!this._content.closeRequest())
				return;
		}
		if (this._closeHandler)
			this._closeHandler(null);
	}

	public get title(): string {
		return this._content ? this._content.windowTitle : '';
	}

	onContextMenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	private initializeContent() {
		if (!this._isInitialized && this._factoryResolver && this._targetType) {
			this._isInitialized = true;
			let instance = this;

			let containerFactory = instance._factoryResolver.resolveComponentFactory(this._targetType);

			let contentRef = instance.contentRef.createComponent(containerFactory, null, instance._injector);
			let content = <ContentComponent>contentRef.instance;

			contentRef.changeDetectorRef.detectChanges();
			contentRef.onDestroy(() => {
				contentRef.changeDetectorRef.detach();
			});

			
			content.initialize(instance._model, instance._closeHandler);
			instance._content = content;
		}
	}

	private recalculateLayout(skipCheckingWidth?: boolean) {
		setTimeout(() => {
		let visibleElement: HTMLElement = this.visibleRef.element.nativeElement;
		let exactNode: HTMLElement = undefined;
		let anchorNode: HTMLElement = this.contentRef.element.nativeElement;
		let contentNode = anchorNode.parentElement;
		if (contentNode && contentNode.children.length > 1) {
			exactNode = contentNode.children[1] as HTMLElement;
		}

		let width = visibleElement.offsetWidth || exactNode.offsetWidth;
		let height = visibleElement.offsetHeight;
		this.left = (window.innerWidth - width) / 2;
		visibleElement.style.left = (this.left > -1) ? (this.left + 'px') : '0';
		this.top = (window.innerHeight - height) / 2;
		visibleElement.style.top = (this.top > -1) ? (this.top + 'px') : '0';
		if (!skipCheckingWidth && (width > window.innerWidth) && exactNode) {
			let newContentWidthLine = (window.innerWidth - FORCE_OFFSET) + 'px';
			exactNode.style.minWidth = newContentWidthLine;
			exactNode.style.maxWidth = newContentWidthLine;
			this.recalculateLayout(true);
			return;
		}
		this._element.nativeElement.style.opacity = '1';
		});

	}

	public onContainerMouseDown(event) {
		let workElement = this.visibleRef.element.nativeElement;
		let horizontalIntersection: boolean =
			(workElement.offsetLeft < event.x) && ((workElement.offsetLeft + workElement.offsetWidth) > event.x);
		if (horizontalIntersection) {
			let verticalIntersection: boolean =
				(workElement.offsetTop < event.y) && ((workElement.offsetTop + workElement.offsetHeight) > event.y);

			if (verticalIntersection) {
				return;
			}
		}
		event.stopPropagation();
		event.preventDefault();
	}

	public onMouseDown(event) {
		event.stopPropagation();
		event.preventDefault();
		this._startLocationX = this.left;
		this._startLocationY = this.top;
		this._startMouseX = event.x;
		this._startMouseY = event.y;
		this.isDragging = true;
	}

	public onContainerMouseUp(event) {
		this.isDragging = false;
	}

	public onContainerMouseMove(event) {
		if (this.isDragging) {
			event.stopPropagation();
			event.preventDefault();
			let x = event.x;
			let y = event.y;
			let minX = ModalContainerComponent._minPositionOffset;
			let maxX = window.innerWidth - ModalContainerComponent._minPositionOffset;
			let minY = ModalContainerComponent._minPositionOffset;
			let maxY = window.innerHeight - ModalContainerComponent._minPositionOffset;
			if (x > maxX)
				x = maxX;
			if (y > maxY)
				y = maxY;
			if (x < minX)
				x = minX;
			if (y < minY)
				y = minY;

			let offsetX = x - this._startMouseX;
			let offsetY = y - this._startMouseY;
			let leftCandidate = this._startLocationX + offsetX;
			let topCandidate = this._startLocationY + offsetY;

			let visibleElement = this.visibleRef.element.nativeElement;
			this.left = leftCandidate;
			this.top = topCandidate;
			visibleElement.style.left = leftCandidate + 'px';
			visibleElement.style.top = topCandidate + 'px';
		}
	}
}

