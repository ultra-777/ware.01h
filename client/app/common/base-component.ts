import { Injector, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Rx';
import { ConfigurationService } from './configuration/configuration.service';
// import { ConfigurationService } from './configuration/configuration.service';

export class BaseComponent implements OnDestroy {

	/**
	 * Is loading data
	 */
	isLoading: boolean;

	/**
	 * Localized resources [id: string]: string
	 */
	language: any;

	/**
	 * Current application settings
	 */
	protected applicationSettings: any;

	private subscriptions: { [id: string]: Subscription } = {};

	constructor(protected injector: Injector) {
		let self = this;

		let configuration = injector.get(ConfigurationService) as ConfigurationService;
		this.applicationSettings = configuration.settings;
		this.language = configuration.language;


		let ngOnDestroyHandler = self.ngOnDestroy;
		self.ngOnDestroy = () => {
			try {
				ngOnDestroyHandler.call(self);
			}
			finally {
				self.ngOnDestroyInternal.call(self);
			}
		};
	}

	ngOnDestroy() {

	}

	private ngOnDestroyInternal() {
		let self = this;
		Object.keys(self.subscriptions).forEach(key => {
			self.unsubscribe(key);
		});
	}

	private unsubscribe(subscriptionId: string) {
		let self = this;
		let subscription = self.subscriptions[subscriptionId] as Subscription;
		if (subscription) {
			subscription.unsubscribe();
			delete self.subscriptions[subscriptionId];
		}
	}
}
