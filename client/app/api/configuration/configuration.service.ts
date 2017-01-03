import {Observable} from 'rxjs/Observable';
import * as HH from '../../common/http-handler';
import {ApplicationSettingsDto} from './application-settings.dto';

export {ApplicationSettingsDto} from './application-settings.dto';
export class LanguageMap { [key: string]: string };

export class ConfigurationService {

	public static getSettings(): Observable<HH.ResultInfo<ApplicationSettingsDto>> {
		return HH.HttpHandler.get<ApplicationSettingsDto>(window.location.origin + '/configuration/applicationSettings');
	}

	public static getLanguage(culture: string): Observable<HH.ResultInfo<LanguageMap>> {
		return HH.HttpHandler.get<LanguageMap>(window.location.origin + '/configuration/language', { culture: culture} );
	}
}