import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type { IASTNode, IUnresolvableNameHolder } from "./interfaces";

export class AddAction implements IASTNode, IUnresolvableNameHolder {
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
}
