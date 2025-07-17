import type { DeleteAction } from "./DeleteAction";
import type { IASTNode, IUnresolvableNameHolder } from "./interfaces";

export class DeleteSection implements IASTNode, IUnresolvableNameHolder {
	readonly type = "DELETE";

	constructor(public readonly expressions: DeleteAction[]) {}

	findReservedWord(): string | undefined {
		for (const expression of this.expressions) {
			const reserved = expression.findReservedWord();
			if (reserved) {
				return reserved;
			}
		}
		return undefined;
	}

	findUnresolvableName(): string | undefined {
		for (const expr of this.expressions) {
			const unresolvable = expr.findUnresolvableName();
			if (unresolvable) {
				return unresolvable;
			}
		}
		return undefined;
	}
}
