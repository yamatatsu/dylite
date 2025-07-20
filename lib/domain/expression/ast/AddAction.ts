import { IncorrectActionOperandTypeError } from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces";

export class AddAction implements IAstNode {
	readonly type = "AddAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: AttributeValue,
	) {}

	traverse(
		visitor: (node: this | PathExpression | AttributeValue) => void,
	): void {
		visitor(this);
		this.path.traverse(visitor);
		this.value.traverse(visitor);
	}

	validateOperandType(): void {
		const resolved = this.value.value();
		if (resolved && !["N", "SS", "NS", "BS"].includes(resolved.type)) {
			throw new IncorrectActionOperandTypeError("ADD", resolved.type);
		}
	}
}
