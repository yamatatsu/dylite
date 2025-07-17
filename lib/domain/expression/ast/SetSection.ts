import type { SetAction } from "./SetAction";
import type {
	IASTNode,
	IUnknownFunctionHolder,
	IUnresolvableValueHolder,
} from "./interfaces.js";

export class SetSection
	implements IASTNode, IUnknownFunctionHolder, IUnresolvableValueHolder
{
	readonly type = "SET";

	constructor(public readonly expressions: SetAction[]) {}

	findReservedWord(): string | undefined {
		for (const expression of this.expressions) {
			const reserved = expression.findReservedWord();
			if (reserved) {
				return reserved;
			}
		}
		return undefined;
	}

	findUnknownFunction(): string | undefined {
		for (const expr of this.expressions) {
			const unknownFunction = expr.findUnknownFunction();
			if (unknownFunction) {
				return unknownFunction;
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
