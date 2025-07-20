import type { AddAction } from "./AddAction";
import type {
	IAstNode,
	IReservedWordHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces";

export class AddSection
	implements
		IAstNode,
		IReservedWordHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder
{
	readonly type = "ADD";

	constructor(public readonly expressions: AddAction[]) {}

	traverse(visitor: (node: this | AddAction) => void): void {
		visitor(this);
		for (const expr of this.expressions) {
			visitor(expr);
		}
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

	findUnresolvableName(): string | undefined {
		for (const expr of this.expressions) {
			const unresolvable = expr.findUnresolvableName();
			if (unresolvable) {
				return unresolvable;
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
