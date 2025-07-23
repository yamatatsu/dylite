import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { AttributeValue } from "./AttributeValue";
import type { DocumentPath } from "./DocumentPath";
import type { FunctionForUpdate } from "./FunctionForUpdate";
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
				| DocumentPath
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
