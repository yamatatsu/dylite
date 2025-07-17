import type { SetAction } from "./SetAction";
import type {
	IASTNode,
	IUnknownFunctionHolder,
	IUnresolvableNameHolder,
} from "./interfaces.js";

export class SetSection
	implements IASTNode, IUnknownFunctionHolder, IUnresolvableNameHolder
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
