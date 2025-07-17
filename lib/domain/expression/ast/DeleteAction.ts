import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";

export class DeleteAction {
	readonly type = "DeleteAction";

	constructor(
		public readonly path: PathExpression,
		public readonly value: AttributeValue,
	) {}
}
