import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class ConditionFunction implements IAstNode {
	readonly type = "ConditionFunction";

	constructor(
		public readonly name: string,
		public readonly args: ConditionOperand[],
	) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		for (const arg of this.args) {
			arg.traverse(visitor);
		}
	}
}
