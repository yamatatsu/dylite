import type { Value } from "../../types";
import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type {
	IIncorrectOperandActionHolder,
	IReservedWordHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces";

export class AddAction
	implements
		IReservedWordHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder,
		IIncorrectOperandActionHolder
{
	readonly type = "AddAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: AttributeValue,
	) {}

	findReservedWord(): string | undefined {
		return this.path.findReservedWord();
	}

	findUnresolvableName(): string | undefined {
		return this.path.getUnresolvableAlias()?.value();
	}

	findUnresolvableValue(): string | undefined {
		const resolved = this.value.value();
		if (!resolved) {
			return this.value.toString();
		}
		return undefined;
	}

	findIncorrectOperandAction(): AddAction | undefined {
		const resolved = this.value.value();
		if (resolved === undefined) {
			return undefined; // Unresolvable value is handled by findUnresolvableValue
		}
		// ADD operation only supports number (N), and set (SS, NS, BS) types
		if (!["N", "SS", "NS", "BS"].includes(resolved.type)) {
			return this;
		}
		return undefined;
	}
}
