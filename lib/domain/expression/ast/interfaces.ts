import type { AddAction } from "./AddAction";
import type { DeleteAction } from "./DeleteAction";
import type { PathExpression } from "./PathExpression";

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

export interface IOverlappedPathHolder {
	findOverlappedPath(): [PathExpression, PathExpression] | undefined;
}

export interface IPathConflictHolder {
	findPathConflict(): [PathExpression, PathExpression] | undefined;
}

export interface IIncorrectOperandActionHolder {
	findIncorrectOperandAction(): AddAction | DeleteAction | undefined;
}
