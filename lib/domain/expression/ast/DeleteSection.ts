import type { DeleteAction } from "./DeleteAction";
import type { IASTNode, IUnresolvableValueHolder } from "./interfaces";

export class DeleteSection implements IASTNode, IUnresolvableValueHolder {
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

	findUnresolvableValue(): string | undefined {
		for (const expr of this.expressions) {
			const unresolvable = expr.findUnresolvableValue();
			if (unresolvable) {
				return unresolvable;
			}
		}
		return undefined;
	}
}
