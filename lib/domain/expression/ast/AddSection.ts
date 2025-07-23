import type { AddAction } from "./AddAction";
import type { AttributeValue } from "./AttributeValue";
import type { DocumentPath } from "./DocumentPath";
import type { IAstNode } from "./interfaces";

export class AddSection implements IAstNode {
	readonly type = "ADD";

	constructor(public readonly expressions: AddAction[]) {}

	traverse(
		visitor: (node: this | AddAction | DocumentPath | AttributeValue) => void,
	): void {
		visitor(this);
		for (const expr of this.expressions) {
			expr.traverse(visitor);
		}
	}
}
