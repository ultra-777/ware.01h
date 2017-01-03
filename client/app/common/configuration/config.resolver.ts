import {Injectable} from '@angular/core';
import {Resolve, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Observable, Subscription} from 'rxjs/Rx';
import {ConfigurationService} from './configuration.service';


class SubscriptionTracker {
	private _settingsSubscription: Subscription;
	private _hasSettings: boolean;
	private _languageSubscription: Subscription;
	private _hasLanguage: boolean;
	private _lastState: boolean;

	private _finalObservable: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

	get final$(): Observable<boolean> {
		return this._finalObservable;
	}

	get state(): boolean {
		return this._lastState;
	}

	applySettings(observable: Observable<any>) {
		if (this._hasSettings || this._settingsSubscription)
			return;
		let instance = this;
		this._settingsSubscription = observable.subscribe(result => {
			instance._hasSettings = true;
			instance.integrate();
		});
	}
	applyLanguage(observable: Observable<any>) {
		if (this._hasLanguage || this._languageSubscription)
			return;
		let instance = this;
		this._languageSubscription = observable.subscribe(result => {
			instance._hasLanguage = true;
			instance.integrate();
		});
	}

	reset() {
		this.dropSettingsSubscription();
		this.dropLanguageSubscription();
		this._hasSettings = false;
		this._hasLanguage = false;
		this.integrate();
	}

	private applyState(newState: boolean) {
		if (this._lastState !== newState) {
			this._lastState = newState;
			this._finalObservable.next(this._lastState);
		}
	}

	private integrate() {
		this.applyState(this._hasSettings && this._hasLanguage);
	}

	private dropSettingsSubscription() {
		if (this._settingsSubscription) {
			this._settingsSubscription.unsubscribe();
			this._settingsSubscription = null;
		}
	}

	private dropLanguageSubscription() {
		if (this._languageSubscription) {
			this._languageSubscription.unsubscribe();
			this._languageSubscription = null;
		}
	}
}

@Injectable()
export class ConfigResolver implements Resolve<any> {

	private static _tracker: SubscriptionTracker = new SubscriptionTracker();

	constructor(private _configuration: ConfigurationService) {
	}

	resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> {
		let instance = this;

		return Observable.create(observer => {

			if (ConfigResolver._tracker.state) {
				observer.next(true);
				observer.complete();
				return;
			}

			ConfigResolver._tracker.applySettings(instance._configuration.settings$);
			ConfigResolver._tracker.applyLanguage(instance._configuration.language$);
			let subscription = ConfigResolver._tracker.final$.subscribe(result => {
				observer.next(true);
				observer.complete();
				if (subscription) {
					subscription.unsubscribe();
					subscription = null;
				}
			});
		});
	}
}