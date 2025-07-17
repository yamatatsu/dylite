export interface IASTNode {
	findReservedWord(): string | undefined;
}

export interface IUnknownFunctionHolder {
	findUnknownFunction(): string | undefined;
}

export interface IUnresolvableNameHolder {
	findUnresolvableName(): string | undefined;
}
