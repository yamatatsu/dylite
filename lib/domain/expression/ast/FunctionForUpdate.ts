import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type { IUnknownFunctionHolder } from "./interfaces";

export class FunctionForUpdate implements IUnknownFunctionHolder {
	public readonly type = "FunctionCall" as const;

	constructor(
		public readonly name: string,
		public readonly args: (
			| FunctionForUpdate
			| AttributeValue
			| PathExpression
		)[],
	) {}

	findUnknownFunction(): string | undefined {
		if (this.name === "if_not_exists" || this.name === "list_append") {
			return undefined;
		}
		return this.name;
	}

	valueType(): string | null {
		switch (this.name) {
			case "if_not_exists":
				switch (this.args[1].type) {
					case "AttributeValue":
						return this.args[1].value()?.type ?? null;
					case "FunctionCall":
						return this.args[1].valueType();
					default:
						return null;
				}
			case "list_append":
				return "L";
		}
		return null;
	}
}
