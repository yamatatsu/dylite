import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { SetAction } from "./SetAction";
import type {
	IIncorrectOperandArithmeticHolder,
	IReservedWordHolder,
	IUnknownFunctionHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces.js";

export class SetSection
	implements
		IReservedWordHolder,
		IUnknownFunctionHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder,
		IIncorrectOperandArithmeticHolder
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

	findUnresolvableValue(): string | undefined {
		for (const expr of this.expressions) {
			const unresolvable = expr.findUnresolvableValue();
			if (unresolvable) {
				return unresolvable;
			}
		}
		return undefined;
	}

	findIncorrectOperandArithmetic(): ArithmeticExpression | undefined {
		for (const expr of this.expressions) {
			const incorrectArithmetic = expr.findIncorrectOperandArithmetic();
			if (incorrectArithmetic) {
				return incorrectArithmetic;
			}
		}
		return undefined;
	}
}
