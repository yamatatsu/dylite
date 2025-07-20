import { IncorrectActionOperandTypeError } from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces";

export class DeleteAction implements IAstNode {
	readonly type = "DeleteAction";

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

	assertOperandType(): void {
		const resolved = this.value.value();
		if (resolved && !["SS", "NS", "BS"].includes(resolved.type)) {
			throw new IncorrectActionOperandTypeError("DELETE", resolved.type);
		}
	}
}
