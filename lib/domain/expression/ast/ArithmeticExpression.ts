import { IncorrectOperandTypeError } from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { DocumentPath } from "./DocumentPath";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { IAstNode } from "./interfaces";

export class ArithmeticExpression implements IAstNode {
	public readonly type = "ArithmeticExpression" as const;

	constructor(
		public readonly operator: "+" | "-",
		public readonly left: FunctionForUpdate | AttributeValue | DocumentPath,
		public readonly right: FunctionForUpdate | AttributeValue | DocumentPath,
	) {}

	traverse(
		visitor: (
			node: this | FunctionForUpdate | AttributeValue | DocumentPath,
		) => void,
	): void {
		visitor(this);
		this.left.traverse(visitor);
		this.right.traverse(visitor);
	}

	validateUsage(): void {
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
		} else if (this.left.type === "DocumentPath") {
			// DocumentPath type cannot be determined at parse time
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
		} else if (this.right.type === "DocumentPath") {
			// DocumentPath type cannot be determined at parse time
			return undefined;
		}

		return undefined;
	}
}
