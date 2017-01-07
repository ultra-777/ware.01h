export class Dimensions {
	public isDirty: boolean;
	private _left: number;
	private _top: number;
	private _width: number;
	private _height: number;


	get left(): number {
		return this._left;
	}
	set left(newValue: number) {
		if (this._left !== newValue) {
			this._left = newValue;
			this.isDirty = true;
		}
	}

	get top(): number {
		return this._top;
	}
	set top(newValue: number) {
		if (this._top !== newValue) {
			this._top = newValue;
			this.isDirty = true;
		}
	}

	get width(): number {
		return this._width;
	}
	set width(newValue: number) {
		if (this._width !== newValue) {
			this._width = newValue;
			this.isDirty = true;
		}
	}

	get height(): number {
		return this._height;
	}
	set height(newValue: number) {
		if (this._height !== newValue) {
			this._height = newValue;
			this.isDirty = true;
		}
	}

	trace() {
		console.log('dimensions: ' + this._left + ' x ' + this._top + ' x ' + this._width + ' x ' + this._height);
	}
}
