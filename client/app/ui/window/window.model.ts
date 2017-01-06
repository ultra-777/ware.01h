
export interface ContentComponent {
	initialize(model: any, closeCallback: (result: any) => void);
	closeRequest: () => boolean;
	windowTitle: string;
}

export interface WindowContainer {
	initialize(model: any, targetType: any, closeCallback: (result: any) => void);
}