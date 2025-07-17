import type { AttributeValue } from "./AttributeValue";
import type { FunctionForUpdate } from "./FunctionForUpdate";
import type { PathExpression } from "./PathExpression";

export class ArithmeticExpression {
	public readonly type = "ArithmeticExpression" as const;

	constructor(
		public readonly operator: "+" | "-",
		public readonly left: FunctionForUpdate | AttributeValue | PathExpression,
		public readonly right: FunctionForUpdate | AttributeValue | PathExpression,
	) {}
}
