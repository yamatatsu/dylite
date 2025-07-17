import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";

export class FunctionForUpdate {
	public readonly type = "FunctionCall" as const;

	constructor(
		public readonly name: string,
		public readonly args: (
			| FunctionForUpdate
			| AttributeValue
			| PathExpression
		)[],
	) {}
}
