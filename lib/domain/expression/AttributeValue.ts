import type { AttributeValue } from "../types";

export class AliasAttributeValue {
	public readonly type = "AttributeValue" as const;

	constructor(
		public readonly name: string,
		private attrValMap: Record<string, AttributeValue>,
	) {}
}
