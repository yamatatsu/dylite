export interface IAstNode {
	traverse(visitor: (node: unknown) => void): void;
}

export interface IReservedWordHolder {
	findReservedWord(): string | undefined;
}

export interface IUnknownFunctionHolder {
	findUnknownFunction(): string | undefined;
}

export interface IUnresolvableNameHolder {
	findUnresolvableName(): string | undefined;
}

export interface IUnresolvableValueHolder {
	findUnresolvableValue(): string | undefined;
}
