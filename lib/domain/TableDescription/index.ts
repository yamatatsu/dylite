import * as v from "valibot";
import { AttributeDefinitions } from "./AttributeDefinitions";
import { KeySchema } from "./KeySchema";

const tableDescriptionSchema = v.object({
	AttributeDefinitions: v.nonNullish(v.unknown()),
	KeySchema: v.nonNullish(v.unknown()),
});

export type PlainTableDescription = v.InferOutput<
	typeof tableDescriptionSchema
>;

export class TableDescription {
	private readonly attributeDefinitions: AttributeDefinitions;
	private readonly keySchema: KeySchema;

	constructor(input: unknown) {
		const result = v.parse(tableDescriptionSchema, input);
		this.attributeDefinitions = new AttributeDefinitions(
			result.AttributeDefinitions,
		);
		this.keySchema = new KeySchema(result.KeySchema, this.attributeDefinitions);
	}
}
