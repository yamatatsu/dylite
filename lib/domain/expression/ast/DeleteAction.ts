import { IncorrectActionOperandTypeError } from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { DocumentPath } from "./DocumentPath";
import type { IAstNode } from "./interfaces";

export class DeleteAction implements IAstNode {
	readonly type = "DeleteAction";

	constructor(
		public readonly path: DocumentPath,
		public readonly value: AttributeValue,
	) {}

	traverse(
		visitor: (node: this | DocumentPath | AttributeValue) => void,
	): void {
		visitor(this);
		this.path.traverse(visitor);
		this.value.traverse(visitor);
	}

	validateOperandType(): void {
		const resolved = this.value.value();
		if (resolved && !["SS", "NS", "BS"].includes(resolved.type)) {
			throw new IncorrectActionOperandTypeError("DELETE", resolved.type);
		}
	}
}
