import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces.js";

export class RemoveAction implements IAstNode {
	readonly type = "RemoveAction";

	constructor(public readonly path: PathExpression) {}

	traverse(visitor: (node: this | PathExpression) => void): void {
		visitor(this);
		this.path.traverse(visitor);
	}
}
