import { type PlainValue, type Value, plainToValue } from "./Value";

export type PlainItem = Record<string, PlainValue.Value>;

export class Item {
	private readonly attributes: Record<string, Value> = {};

	constructor(attributes: PlainItem) {
		for (const key in attributes) {
			this.attributes[key] = plainToValue(attributes[key]);
		}
	}

	get(attributeName: string): Value | null {
		return this.attributes[attributeName] ?? null;
	}

	toPlain(): PlainItem {
		const plainAttributes: PlainItem = {};
		for (const key in this.attributes) {
			plainAttributes[key] = this.attributes[key].toPlain();
		}
		return plainAttributes;
	}
}
