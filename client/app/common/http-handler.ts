import { ReflectiveInjector } from '@angular/core';
import {
	HttpModule,
	Http,
	ConnectionBackend,
	RequestOptions,
	BrowserXhr,
	XHRBackend,
	BaseRequestOptions,
	ResponseOptions,
	BaseResponseOptions,
	Headers,
	XSRFStrategy,
	CookieXSRFStrategy,
	Response
} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

export class JsonParserEx {

	public static parse2lower<T>(text): T {
		let rawData = JSON.parse(text);
		if (!rawData)
			return null;

		return <T>JsonParserEx.handleMember(rawData);
	}

	public static handleMember(scope, key: string = null): any {

		if (key) {
			let pureKey = key.trim();
			if (pureKey.length < 1)
				return null;
			let memberValue = JsonParserEx.handleMember(scope[key]);
			let lowerKey = pureKey[0].toLowerCase() + pureKey.substring(1);
			if (lowerKey !== key) {
				delete scope[key];
			}
			scope[lowerKey] = memberValue;
			return memberValue;
		}
		else {
			if (typeof scope === 'object') {
				for (let memberKey in scope) {
					JsonParserEx.handleMember(scope, memberKey);
				}
			}
			return scope;
		}
	}
}

export class ResultInfo<T> {
	constructor(succeeded: boolean, data: T, message: string) {
		this.succeeded = succeeded;
		this.data = data;
		this.message = message;
	}

	static success<T>(data: T): ResultInfo<T> {
		return new ResultInfo<T>(true, data, null);
	};

	static failure<T>(errorMessage) {
		return new ResultInfo<T>(false, null, errorMessage);
	};

	public succeeded: boolean;
	public message: string;
	public data: T;
}

export class HttpHandler {

	private static _http: Http = null;
	private static _headers = new Headers({ 'Content-Type': 'application/json' });

	public static post<T>(
		url: string,
		data?: Object,
		checkResultJson?: boolean,
		addUniquePostfix?: boolean): Observable<ResultInfo<T>> {

		return HttpHandler.handleSubscription<T>(
			HttpHandler.getHttp()
				.post(
				HttpHandler.buildUrl(url, addUniquePostfix),
				!data
					? {}
					: JSON.stringify(data),
				{ headers: HttpHandler._headers }
				),
			checkResultJson
		);
	}

	public static get<T>(
		url: string,
		data?: Object,
		checkResultJson?: boolean,
		addUniquePostfix?: boolean): Observable<ResultInfo<T>> {
		let finalUrl = HttpHandler.buildGetQuery(url, data, addUniquePostfix);
		return HttpHandler.handleSubscription<T>(
			HttpHandler.getHttp().get(finalUrl),
			checkResultJson
		);
	}

	private static buildGetQuery(
		url: string,
		data?: Object,
		addUniquePostfix?: boolean): string {
		let finalUrl = url;
		if (finalUrl && data && (typeof data === 'object')) {
			let index = 0;
			for (let key in data) {
				let theValue = data[key];
				if (!theValue)
					continue;
				if (index === 0)
					finalUrl = finalUrl + '?';
				else
					finalUrl = finalUrl + '&';

				finalUrl = finalUrl + key + '=' +
					((typeof theValue !== 'object')
						? theValue.toString()
						: JSON.stringify(theValue));

				index = index + 1;
			}
		}
		return HttpHandler.buildUrl(finalUrl, addUniquePostfix);
	}

	private static handleSubscription<T>(observable: Observable<Response>, checkResultJson?: boolean): Observable<ResultInfo<T>> {
		return Observable.create(observer => {
			let subscription =
				observable
					.map((res: any) => {
						let text = res.text();
						if (text)
							return checkResultJson
								? JsonParserEx.parse2lower<T>(res.text())
								: res.json();
						else
							return null;
					})
					.subscribe(
					(result) => {
						observer.next(ResultInfo.success<T>(result));
						observer.complete();
					},
					(error) => {
						let message: string = null;
						if (error) {
							if (error.message)
								message = error.message;
							else {
								if (error._body && typeof error._body === 'string') {
									message = error._body;
								}
							}
						}
						observer.next(ResultInfo.failure<T>(message ? message : error));
						observer.complete();
					});

			return (() => {
				subscription.unsubscribe();
			});
		});
	}

	private static buildUrl(target: string, addUniquePostfix?: boolean): string {
		return target + (addUniquePostfix ? (((target.indexOf('?') > -1) ? '&' : '?') + 'v=' + ((new Date()).getTime())) : '');
	}

	private static getHttp(): Http {
		if (HttpHandler._http == null) {

			let injector = ReflectiveInjector.resolveAndCreate([
				BaseRequestOptions, XHRBackend, BrowserXhr, {
					provide: Http,
					useFactory: function (backend: XHRBackend, defaultOptions: BaseRequestOptions) {
						return new Http(backend, defaultOptions);
					},
					deps: [XHRBackend, BaseRequestOptions]
				},
				{ provide: ResponseOptions, useClass: BaseResponseOptions },
				{
					provide: XSRFStrategy, useFactory: function () {
						return new CookieXSRFStrategy();
					}
				}
			]);
			let http = injector.get(Http);
			if (!http)
				throw new Error('http has not been injected');
			HttpHandler._http = http;
		}
		return HttpHandler._http;
	}
}
