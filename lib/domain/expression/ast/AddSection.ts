import type { AddAction } from "./AddAction";
import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces";

export class AddSection implements IAstNode {
	readonly type = "ADD";

	constructor(public readonly expressions: AddAction[]) {}

	traverse(
		visitor: (node: this | AddAction | PathExpression | AttributeValue) => void,
	): void {
		visitor(this);
		for (const expr of this.expressions) {
			expr.traverse(visitor);
		}
	}
}
