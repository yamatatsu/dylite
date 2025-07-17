import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";

export class AddAction {
	readonly type = "AddAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: AttributeValue,
	) {}
}
