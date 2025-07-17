import type { ArithmeticExpression } from "./ArithmeticExpression";
import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";
import type {
	IASTNode,
	IUnknownFunctionHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces";

export type Operand =
	| PathExpression
	| AttributeValue
	| FunctionForUpdate
	| ArithmeticExpression;

export class SetAction
	implements
		IASTNode,
		IUnknownFunctionHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder
{
	readonly type = "SetAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: Operand,
	) {}

	findReservedWord(): string | undefined {
		return (
			this.path.findReservedWord() ||
			(this.value.type === "PathExpression"
				? this.value.findReservedWord()
				: undefined)
		);
	}

	findUnknownFunction(): string | undefined {
		if (this.value.type !== "FunctionCall") {
			return undefined;
		}
		return this.value.findUnknownFunction();
	}

	findUnresolvableName(): string | undefined {
		return this.path.getUnresolvableAlias()?.toString();
	}

	findUnresolvableValue(): string | undefined {
		if (this.value.type === "AttributeValue") {
			const resolved = this.value.value();
			if (!resolved) {
				return this.value.toString();
			}
		}
		return undefined;
	}
}
