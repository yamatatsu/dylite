import { type PlainValue, type Value, plainToValue } from "../../Value";
import type { IAstNode, IIncorrectOperandArithmeticHolder } from "./interfaces";

export class AttributeValue
	implements IIncorrectOperandArithmeticHolder, IAstNode
{
	public readonly type = "AttributeValue" as const;
	private attrValMap: Record<string, Value>;

	constructor(
		private readonly name: string,
		attrValMap: Record<string, PlainValue.Value>,
	) {
		this.attrValMap = Object.fromEntries(
			Object.entries(attrValMap).map(([key, value]) => [
				key,
				plainToValue(value),
			]),
		);
	}

	traverse(visitor: (node: this) => void): void {
		visitor(this);
	}

	findIncorrectOperandArithmetic(): undefined {
		return undefined;
	}

	value(): Value | undefined {
		return this.attrValMap[this.name];
	}

	toString(): string {
		return this.name;
	}
}
