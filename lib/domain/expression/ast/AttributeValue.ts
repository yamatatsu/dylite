import { type PlainValue, type Value, plainToValue } from "../../Value";
import { UnresolvableAttributeValueError } from "./AstError";
import type { IAstNode } from "./interfaces";

export class AttributeValue implements IAstNode {
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

	validateResolvability(): void {
		if (!this.value()) {
			throw new UnresolvableAttributeValueError(this.name);
		}
	}

	valueType(): string | undefined {
		return this.value()?.type;
	}

	value(): Value | undefined {
		return this.attrValMap[this.name];
	}

	toString(): string {
		return this.name;
	}
}
