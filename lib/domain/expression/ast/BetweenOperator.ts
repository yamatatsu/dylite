import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class BetweenOperator implements IAstNode {
	readonly type = "BetweenOperator";

	constructor(
		public readonly operand: ConditionOperand,
		public readonly lowerBound: ConditionOperand,
		public readonly upperBound: ConditionOperand,
	) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		this.operand.traverse(visitor);
		this.lowerBound.traverse(visitor);
		this.upperBound.traverse(visitor);
	}
}
