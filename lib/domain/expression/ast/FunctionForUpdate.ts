import {
	DocumentPathRequiredError,
	IncorrectOperandTypeError,
	NumberOfOperandsError,
	UnknownFunctionError,
} from "./AstError";
import type { AttributeValue } from "./AttributeValue";
import type { PathExpression } from "./PathExpression";
import type { IAstNode } from "./interfaces";

export class FunctionForUpdate implements IAstNode {
	public readonly type = "FunctionCall" as const;

	constructor(
		public readonly name: string,
		public readonly args: (
			| FunctionForUpdate
			| AttributeValue
			| PathExpression
		)[],
	) {}

	traverse(
		visitor: (
			node: this | FunctionForUpdate | AttributeValue | PathExpression,
		) => void,
	): void {
		visitor(this);
		for (const arg of this.args) {
			arg.traverse(visitor);
		}
	}

	validateUnknownFunction(): void {
		if (this.name !== "if_not_exists" && this.name !== "list_append") {
			throw new UnknownFunctionError(this.name);
		}
	}

	valueType(): string | undefined {
		switch (this.name) {
			case "if_not_exists":
				switch (this.args[1].type) {
					case "AttributeValue":
					case "FunctionCall":
						return this.args[1].valueType();
					default:
						return;
				}
			case "list_append":
				return "L";
		}
	}

	validateUsage(): void {
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
				const type = arg.type !== "PathExpression" && arg.valueType();
				if (type && type !== "L") {
					throw new IncorrectOperandTypeError(this.name, type);
				}
			}
		}
	}
}
