import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type { IASTNode, IUnresolvableValueHolder } from "./interfaces";

export class DeleteAction implements IASTNode, IUnresolvableValueHolder {
	readonly type = "DeleteAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: AttributeValue,
	) {}

	findReservedWord(): string | undefined {
		return this.path.findReservedWord();
	}

	findUnresolvableValue(): string | undefined {
		return this.path.getUnresolvableAlias()?.value();
	}
}
