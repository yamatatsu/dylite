import { MisusedFunctionError } from "./AstError";
import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class InOperator implements IAstNode {
	readonly type = "InOperator";

	constructor(
		public readonly left: ConditionOperand,
		public readonly right: ConditionOperand[],
	) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		this.left.traverse(visitor);
		for (const item of this.right) {
			item.traverse(visitor);
		}
	}

	validateMisusedFunctions(): void {
		const operands = [this.left, ...this.right];
		for (const op of operands) {
			if (op.type === "ConditionFunction" && op.name !== "size") {
				throw new MisusedFunctionError(op.name);
			}
		}
	}
}
