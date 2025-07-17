import type { AddAction } from "./AddAction";
import type { IASTNode, IUnresolvableNameHolder } from "./interfaces";

export class AddSection implements IASTNode, IUnresolvableNameHolder {
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
