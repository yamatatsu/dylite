import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type {
	IIncorrectOperandActionHolder,
	IReservedWordHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces";

export class DeleteAction
	implements
		IReservedWordHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder,
		IIncorrectOperandActionHolder
{
	readonly type = "DeleteAction";

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

	findIncorrectOperandAction(): DeleteAction | undefined {
		const resolved = this.value.value();
		if (resolved === undefined) {
			return undefined; // Unresolvable value is handled by findUnresolvableValue
		}
		// DELETE operation only supports set types (SS, NS, BS)
		if (!["SS", "NS", "BS"].includes(resolved.type)) {
			return this;
		}
		return undefined;
	}
}
