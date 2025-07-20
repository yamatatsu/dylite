import type { DeleteAction } from "./DeleteAction";
import type {
	IAstNode,
	IIncorrectOperandActionHolder,
	IReservedWordHolder,
	IUnresolvableNameHolder,
	IUnresolvableValueHolder,
} from "./interfaces";

export class DeleteSection
	implements
		IAstNode,
		IReservedWordHolder,
		IUnresolvableNameHolder,
		IUnresolvableValueHolder,
		IIncorrectOperandActionHolder
{
	readonly type = "DELETE";

	constructor(public readonly expressions: DeleteAction[]) {}

	traverse(visitor: unknown): void {
		// TODO: implement me
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

	findIncorrectOperandAction(): DeleteAction | undefined {
		for (const expr of this.expressions) {
			const incorrectAction = expr.findIncorrectOperandAction();
			if (incorrectAction) {
				return incorrectAction;
			}
		}
		return undefined;
	}
}
