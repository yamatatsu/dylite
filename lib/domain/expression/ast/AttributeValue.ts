import { type PlainValue, type Value, plainToValue } from "../../Value";
import type { IIncorrectOperandArithmeticHolder } from "./interfaces";

export class AttributeValue implements IIncorrectOperandArithmeticHolder {
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
