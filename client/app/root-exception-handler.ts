import {ErrorHandler} from '@angular/core';

export class RootExceptionHandler extends ErrorHandler {
	constructor() {
		super(null);
	}
	call(error: Error, stacktrace = null, reason = null) {
		// The policy is not defined yet...
		// console.log('RootExceptionHandler: ' + JSON.stringify(error.toString()));
		let message: string = (error.message || '') + '\r\n' + (error.stack || '');
		console.log('RootExceptionHandler: ' + message);
	}
}