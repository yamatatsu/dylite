import type { RemoveAction } from "./RemoveAction";
import type { IAstNode, IReservedWordHolder } from "./interfaces.js";

export class RemoveSection implements IReservedWordHolder, IAstNode {
	readonly type = "REMOVE";

	constructor(public readonly expressions: RemoveAction[]) {}

	traverse(visitor: unknown): void {
		// TODO: implement me
	}

	findReservedWord(): string | undefined {
		for (const expression of this.expressions) {
			const reserved = expression.findReservedWord();
			if (reserved) {
				return reserved;
			}
		}
		return undefined;
	}
}
