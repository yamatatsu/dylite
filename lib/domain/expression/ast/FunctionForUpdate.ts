import {
	DocumentPathRequiredError,
	IncorrectOperandTypeError,
	NumberOfOperandsError,
} from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type {
	IAstNode,
	IIncorrectOperandArithmeticHolder,
	IUnknownFunctionHolder,
} from "./interfaces";

export class FunctionForUpdate
	implements IUnknownFunctionHolder, IIncorrectOperandArithmeticHolder, IAstNode
{
	public readonly type = "FunctionCall" as const;

	constructor(
		public readonly name: string,
		public readonly args: (
			| FunctionForUpdate
			| AttributeValue
			| PathExpression
		)[],
	) {}

	traverse(visitor: (node: this) => void): void {
		visitor(this);
	}

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

	findIncorrectOperandArithmetic(): undefined {
		return undefined;
	}

	assertValidUsage(): void {
		if (this.args.length < 2) {
			throw new NumberOfOperandsError(this.name, this.args.length);
		}
		if (
			this.name === "if_not_exists" &&
			this.args[0].type !== "PathExpression"
		) {
			throw new DocumentPathRequiredError(this.name);
		}
		if (this.name === "list_append") {
			for (const arg of this.args) {
				const type =
					(arg.type === "AttributeValue" && arg.value()?.type) ||
					(arg.type === "FunctionCall" && arg.valueType());
				if (type && type !== "L") {
					throw new IncorrectOperandTypeError(this.name, type);
				}
			}
		}
	}
}
