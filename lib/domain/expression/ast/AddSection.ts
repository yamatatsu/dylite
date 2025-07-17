import type { AddAction } from "./AddAction";
import type { IASTNode, IUnresolvableValueHolder } from "./interfaces";

export class AddSection implements IASTNode, IUnresolvableValueHolder {
	readonly type = "ADD";

	constructor(public readonly expressions: AddAction[]) {}

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
