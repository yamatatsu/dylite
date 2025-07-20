import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces";

export type Operand =
	| PathExpression
	| AttributeValue
	| FunctionForUpdate
	| ArithmeticExpression;

export class SetAction implements IAstNode {
	readonly type = "SetAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: Operand,
	) {}

	traverse(visitor: (node: this | Operand) => void): void {
		visitor(this);
		this.path.traverse(visitor);
		this.value.traverse(visitor);
	}
}
