import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class NotOperator implements IAstNode {
	readonly type = "NotOperator";

	constructor(public readonly operand: ConditionNode) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		this.operand.traverse(visitor);
	}
}
