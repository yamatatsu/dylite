import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type { IIncorrectOperandArithmeticHolder } from "./interfaces";

export class ArithmeticExpression implements IIncorrectOperandArithmeticHolder {
	public readonly type = "ArithmeticExpression" as const;

	constructor(
		public readonly operator: "+" | "-",
		public readonly left: FunctionForUpdate | AttributeValue | PathExpression,
		public readonly right: FunctionForUpdate | AttributeValue | PathExpression,
	) {}

	findIncorrectOperandArithmetic(): ArithmeticExpression | undefined {
		const operand = this.getIncorrectOperand();
		if (operand) {
			return this;
		}
		return undefined;
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
