import { IncorrectActionOperandTypeError } from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type {
	IAstNode,
	IReservedWordHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces";

export class DeleteAction
	implements
		IAstNode,
		IReservedWordHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder
{
	readonly type = "DeleteAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: AttributeValue,
	) {}

	traverse(visitor: (node: this) => void): void {
		visitor(this);
		// TODO: need to visit child nodes
	}

	assertOperandType(): void {
		const resolved = this.value.value();
		if (resolved && !["SS", "NS", "BS"].includes(resolved.type)) {
			throw new IncorrectActionOperandTypeError("DELETE", resolved.type);
		}
	}

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
}
