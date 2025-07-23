import type { AttributeValue } from "./AttributeValue";
import type { DeleteAction } from "./DeleteAction";
import type { DocumentPath } from "./DocumentPath";
import type { IAstNode } from "./interfaces";

export class DeleteSection implements IAstNode {
	readonly type = "DELETE";

	constructor(public readonly expressions: DeleteAction[]) {}

	traverse(
		visitor: (
			node: this | DeleteAction | DocumentPath | AttributeValue,
		) => void,
	): void {
		visitor(this);
		for (const expr of this.expressions) {
			expr.traverse(visitor);
		}
	}
}
