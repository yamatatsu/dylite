import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type { SetAction } from "./SetAction";
import type { IAstNode } from "./interfaces.js";

export class SetSection implements IAstNode {
	readonly type = "SET";

	constructor(public readonly expressions: SetAction[]) {}

	traverse(
		visitor: (
			node:
				| this
				| SetAction
				| PathExpression
				| AttributeValue
				| FunctionForUpdate
				| ArithmeticExpression,
		) => void,
	): void {
		visitor(this);
		for (const expression of this.expressions) {
			expression.traverse(visitor);
		}
	}
}
