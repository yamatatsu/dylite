import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";

export type Operand =
	| PathExpression
	| AttributeValue
	| FunctionForUpdate
	| ArithmeticExpression;

export class SetAction {
	readonly type = "SetAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: Operand,
	) {}
}
