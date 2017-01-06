import {
	ComponentRef,
	ViewContainerRef,
	Injector,
	Injectable,
	ComponentFactoryResolver,
} from '@angular/core';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/share';
import { ModalContainerComponent } from './modal-container.component';
import { ContentComponent, WindowContainer } from './window.model';

export { ContentComponent, WindowContainer } from './window.model';



@Injectable()
export class WindowService {
	private static _rootViewContainerRef: ViewContainerRef;

	constructor(
		private _injector: Injector,
		private _factoryResolver: ComponentFactoryResolver
	) {
	}


	openModal<TResult>(type: any, model?: any): Observable<TResult> {

		let instance = this;
		return Observable.create(observer => {

			let containerRef: ComponentRef<ModalContainerComponent> = null;
			let closeHandler = ((result: TResult) => {

				if (containerRef) {
					containerRef.destroy();
					containerRef = null;
				}

				observer.next(result);
				observer.complete();
			});

			let containerFactory = instance._factoryResolver.resolveComponentFactory(ModalContainerComponent);
			containerRef = WindowService._rootViewContainerRef.createComponent(containerFactory, null, instance._injector);
			let windowContainer = <WindowContainer>containerRef.instance;
			windowContainer.initialize(model, type, closeHandler);

			return (() => {
				closeHandler(null);
			});

		});
	}

	public initializeRoot(rootViewContainerRef: ViewContainerRef) {
		WindowService._rootViewContainerRef = rootViewContainerRef;
	}
}