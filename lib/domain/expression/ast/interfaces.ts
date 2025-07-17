export interface IASTNode {
	findReservedWord(): string | undefined;
}

export interface IUnknownFunctionHolder {
	findUnknownFunction(): string | undefined;
}

export interface IUnresolvableValueHolder {
	findUnresolvableValue(): string | undefined;
}
