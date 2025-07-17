import type { PathExpression } from "./PathExpression";
import type { IASTNode } from "./interfaces.js";

export class RemoveAction implements IASTNode {
	readonly type = "RemoveAction";

	constructor(public readonly path: PathExpression) {}

	findReservedWord(): string | undefined {
		return this.path.findReservedWord();
	}
}
