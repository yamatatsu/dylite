import type { DocumentPath } from "./DocumentPath";
import type { IAstNode } from "./interfaces.js";

export class RemoveAction implements IAstNode {
	readonly type = "RemoveAction";

	constructor(public readonly path: DocumentPath) {}

	traverse(visitor: (node: this | DocumentPath) => void): void {
		visitor(this);
		this.path.traverse(visitor);
	}
}
