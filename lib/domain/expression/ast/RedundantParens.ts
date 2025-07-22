import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class RedundantParens implements IAstNode {
	readonly type = "RedundantParens";

	constructor(public readonly expression: ConditionNode) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		this.expression.traverse(visitor);
	}
}
