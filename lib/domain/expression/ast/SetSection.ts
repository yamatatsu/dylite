import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type { SetAction } from "./SetAction";
import type {
	IAstNode,
	IReservedWordHolder,
	IUnknownFunctionHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces.js";

export class SetSection
	implements
		IAstNode,
		IReservedWordHolder,
		IUnknownFunctionHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder
{
	readonly type = "SET";

	constructor(public readonly expressions: SetAction[]) {}

	traverse(
		visitor: (
			node:
				| this
				| SetAction
				| PathExpression
				| AttributeValue
				| FunctionForUpdate
				| ArithmeticExpression,
		) => void,
	): void {
		visitor(this);
		for (const expression of this.expressions) {
			expression.traverse(visitor);
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
}
