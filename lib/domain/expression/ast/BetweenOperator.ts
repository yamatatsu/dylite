import { BetweenBoundsError, BetweenOperandTypeError } from "./AstError";
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

	validateBounds(): void {
		if (
			this.lowerBound.type === "AttributeValue" &&
			this.upperBound.type === "AttributeValue"
		) {
			const lower = this.lowerBound.value();
			const upper = this.upperBound.value();
			if (lower && upper) {
				if (lower.type !== upper.type) {
					throw new BetweenOperandTypeError(lower, upper);
				}
				if (lower.gt(upper)) {
					throw new BetweenBoundsError(lower, upper);
				}
			}
		}
	}

	validateMisusedFunctions(): void {
		const operands = [this.operand, this.lowerBound, this.upperBound];
		for (const op of operands) {
			if (op.type === "ConditionFunction") {
				op.validateAsMisused();
			}
		}
	}
}
