import type { Value } from "../../types";

export class AttributeValue {
	public readonly type = "AttributeValue" as const;

	constructor(
		private readonly name: string,
		private attrValMap: Record<string, Value>,
	) {}

	value(): Value | undefined {
		return this.attrValMap[this.name];
	}

	toString(): string {
		return this.name;
	}
}
