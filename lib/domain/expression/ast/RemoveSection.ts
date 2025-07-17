import type { RemoveAction } from "./RemoveAction";
import type { IASTNode } from "./interfaces.js";

export class RemoveSection implements IASTNode {
	readonly type = "REMOVE";

	constructor(public readonly expressions: RemoveAction[]) {}

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
