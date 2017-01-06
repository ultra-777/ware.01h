export enum MessageType {
	Ok,
	OkCancel,
	YesNo,
	YesNoCancel
}

export enum ResultType {
	Ok,
	Cancel,
	Yes,
	No
}

export class MessageBoxModel {
	public type: MessageType;
	public title: string;
	public message: string;

	constructor() {
		this.type = MessageType.Ok;
	}
}