import * as v from "valibot";
import { validationException } from "../errors";

const attributeTypeSchema = v.picklist(["S", "N", "B"]);
const attributeDefinitionsSchema = v.array(
	v.object({
		AttributeName: v.string(),
		AttributeType: attributeTypeSchema,
	}),
);

export type AttributeType = v.InferOutput<typeof attributeTypeSchema>;

export class AttributeDefinitions {
	private readonly definitions: Map<string, AttributeType>;

	constructor(input: unknown) {
		this.definitions = new Map<string, AttributeType>();
		const parsed = v.parse(attributeDefinitionsSchema, input);
		for (const { AttributeName, AttributeType } of parsed) {
			if (this.definitions.has(AttributeName)) {
				throw validationException(
					"Cannot have two attributes with the same name",
				);
			}
			this.definitions.set(AttributeName, AttributeType);
		}
	}

	public getType(attributeName: string): AttributeType {
		const type = this.definitions.get(attributeName);
		if (type == null) {
			throw validationException(
				`One or more parameter values were invalid: Some index key attributes are not defined in AttributeDefinitions. Keys: [${attributeName}], AttributeDefinitions: [${this.keys().join(", ")}]`,
			);
		}
		return type;
	}

	public keys(): string[] {
		return Array.from(this.definitions.keys());
	}
}
