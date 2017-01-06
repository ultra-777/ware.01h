import {MessageBoxModel, MessageType, ResultType} from './message-box.model';
import {MessageBoxService} from './message-box.service';
import {MessageBoxComponent} from './message-box.component';

export * from './message-box.model';
export * from './message-box.service';
export * from './message-box.component';

export const DECLARATION: any[] = [
	MessageBoxComponent
];

export const PROVIDER: any[] = [
	MessageBoxService
];

export const MODEL: any[] = [
	MessageBoxModel,
	MessageType,
	ResultType
];