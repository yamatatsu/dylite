import { IncorrectOperandTypeError } from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces";

export class ArithmeticExpression implements IAstNode {
	public readonly type = "ArithmeticExpression" as const;

	constructor(
		public readonly operator: "+" | "-",
		public readonly left: FunctionForUpdate | AttributeValue | PathExpression,
		public readonly right: FunctionForUpdate | AttributeValue | PathExpression,
	) {}

	traverse(
		visitor: (
			node: this | FunctionForUpdate | AttributeValue | PathExpression,
		) => void,
	): void {
		visitor(this);
		this.left.traverse(visitor);
		this.right.traverse(visitor);
	}

	assertValidUsage(): void {
		const operand = this.getIncorrectOperand();
		if (operand) {
			throw new IncorrectOperandTypeError(
				this.operator,
				operand.valueType() || "unknown",
			);
		}
	}

	getIncorrectOperand(): AttributeValue | FunctionForUpdate | undefined {
		// Check left operand
		if (this.left.type === "AttributeValue") {
			const resolved = this.left.value();
			if (resolved && resolved.type !== "N") {
				return this.left;
			}
		} else if (this.left.type === "FunctionCall") {
			const valueType = this.left.valueType();
			if (valueType && valueType !== "N") {
				return this.left;
			}
		} else if (this.left.type === "PathExpression") {
			// PathExpression type cannot be determined at parse time
			return undefined;
		}

		// Check right operand
		if (this.right.type === "AttributeValue") {
			const resolved = this.right.value();
			if (resolved && resolved.type !== "N") {
				return this.right;
			}
		} else if (this.right.type === "FunctionCall") {
			const valueType = this.right.valueType();
			if (valueType && valueType !== "N") {
				return this.right;
			}
		} else if (this.right.type === "PathExpression") {
			// PathExpression type cannot be determined at parse time
			return undefined;
		}

		return undefined;
	}
}
