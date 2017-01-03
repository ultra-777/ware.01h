import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {ConfigurationService as CS, LanguageMap as LM} from '../../api/configuration/configuration.service';
import {ResultInfo} from '../http-handler';
import {ApplicationSettingsDto} from '../../api/configuration/application-settings.dto';
export {LanguageMap} from '../../api/configuration/configuration.service';

const DEFAULT_LOCALE: string = 'en-US';


@Injectable()
export class ConfigurationService {
	private static _origin: string = window.location.origin;

	private static _settingsObservable: ReplaySubject<ApplicationSettingsDto> = new ReplaySubject<ApplicationSettingsDto>(1);
	private static _settingsSubscription: Subscription;
	private static _settings: ApplicationSettingsDto = new ApplicationSettingsDto();

	private static _languageObservable: ReplaySubject<LM> = new ReplaySubject<any>(1);
	private static _languageSubscription: Subscription;
	private static _language: LM = {};

	constructor() {

	}

	public get settings$(): Observable<ApplicationSettingsDto> {
		return ConfigurationService._settingsObservable;
	}

	public get settings(): ApplicationSettingsDto {
		return ConfigurationService._settings;
	}

	public get culture(): string {
		return ConfigurationService._settings.culture || DEFAULT_LOCALE;
	}

	public get language$(): Observable<any> {
		return ConfigurationService._languageObservable;
	}

	public get language(): any {
		return ConfigurationService._language;
	}

	public static get origin(): string {
		return ConfigurationService._origin;
	}

	public static getApiPrefix(version: string = '1.0'): string {
		return '/app/v' + version + '/api/';
	}

	public static refresh() {
		ConfigurationService.refreshSettings();
	}

	public static refreshSettings() {
		ConfigurationService.dropSettingsSubscription();
		ConfigurationService._settingsSubscription =
			CS.getSettings().subscribe(result => {
				ConfigurationService.applyObjectResult(ConfigurationService._settings, result);
				ConfigurationService._settingsObservable.next(ConfigurationService._settings);
				ConfigurationService.dropSettingsSubscription();
				ConfigurationService.refreshLanguage();
			});
	}

	public static refreshLanguage() {
		ConfigurationService.dropLanguageSubscription();
		ConfigurationService._languageSubscription =
			CS.getLanguage(ConfigurationService._settings.culture || DEFAULT_LOCALE).subscribe(result => {
				ConfigurationService.applyObjectResult(ConfigurationService._language, result);
				ConfigurationService._languageObservable.next(ConfigurationService._language);
				ConfigurationService.dropLanguageSubscription();
			});
	}

	private static applyObjectResult(target: any, result: ResultInfo<any>) {
		if (result.succeeded) {
			Object.assign(target || {}, result.data);
		}
		else {
			Object.keys(target).forEach(function (key) { delete target[key]; });
		}
	}

	private static dropLanguageSubscription() {
		if (ConfigurationService._languageSubscription) {
			ConfigurationService._languageSubscription.unsubscribe();
			ConfigurationService._languageSubscription = null;
		}
	}

	private static dropSettingsSubscription() {
		if (ConfigurationService._settingsSubscription) {
			ConfigurationService._settingsSubscription.unsubscribe();
			ConfigurationService._settingsSubscription = null;
		}
	}
}