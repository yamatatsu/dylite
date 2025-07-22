import { DistinctOperandsError } from "./AstError";
import type { ConditionNode, ConditionOperand } from "./ConditionExpression";
import type { IAstNode } from "./interfaces";

export class ComparisonOperator implements IAstNode {
	readonly type = "ComparisonOperator";

	constructor(
		public readonly operator: ">=" | "<=" | "<>" | "=" | "<" | ">",
		public readonly left: ConditionOperand,
		public readonly right: ConditionOperand,
	) {}

	traverse(visitor: (node: ConditionNode | ConditionOperand) => void): void {
		visitor(this);
		this.left.traverse(visitor);
		this.right.traverse(visitor);
	}

	validateDistinctOperands(): void {
		if (
			this.left.type === "PathExpression" &&
			this.right.type === "PathExpression"
		) {
			if (this.left.toString() === this.right.toString()) {
				throw new DistinctOperandsError(this.operator, this.left.toString());
			}
		}
	}

	validateMisusedFunctions(): void {
		const operands = [this.left, this.right];
		for (const op of operands) {
			if (op.type === "ConditionFunction") {
				op.validateAsMisused();
			}
		}
	}
}
