import type { AttributeValue } from "../types";

export class AliasAttributeValue {
	public readonly type = "AttributeValue" as const;

	constructor(
		private readonly name: string,
		private attrValMap: Record<string, AttributeValue>,
	) {}

	value(): AttributeValue | undefined {
		return this.attrValMap[this.name];
	}

	toString(): string {
		return this.name;
	}
}
