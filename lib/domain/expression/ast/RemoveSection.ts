import type { PathExpression } from "./PathExpression";
import type { RemoveAction } from "./RemoveAction";
import type { IAstNode } from "./interfaces.js";

export class RemoveSection implements IAstNode {
	readonly type = "REMOVE";

	constructor(public readonly expressions: RemoveAction[]) {}

	traverse(
		visitor: (node: this | RemoveAction | PathExpression) => void,
	): void {
		visitor(this);
		for (const expr of this.expressions) {
			expr.traverse(visitor);
		}
	}
}
