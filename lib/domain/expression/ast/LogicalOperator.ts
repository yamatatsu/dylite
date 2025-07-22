import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class LogicalOperator implements IAstNode {
	readonly type = "LogicalOperator";

	constructor(
		public readonly operator: "AND" | "OR",
		public readonly left: ConditionNode,
		public readonly right: ConditionNode,
	) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		this.left.traverse(visitor);
		this.right.traverse(visitor);
	}
}
