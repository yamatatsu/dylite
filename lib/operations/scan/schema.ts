import * as v from "valibot";
import { validationException } from "../../domain/errors";
import { attributeValueSchema } from "../../validations/attributeValueSchema";
import { atLeastOneItem, unique } from "../../validations/util-validations";
import { validateExpressionParams } from "../../validations/validateExpressionParams";
import { validateExpressions } from "../../validations/validateExpressions";
import { tableNameSchema } from "../common";

const schema = v.object({
	ReturnConsumedCapacity: v.nullish(v.picklist(["INDEXES", "TOTAL", "NONE"])),
	AttributesToGet: v.nullish(
		v.pipe(
			v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(255))),
			unique,
		),
	),
	TableName: tableNameSchema("TableName"),
	ConsistentRead: v.nullish(v.boolean()),
	ExclusiveStartKey: v.nullish(v.record(v.string(), attributeValueSchema)),
	FilterExpression: v.nullish(v.string()),
	ProjectionExpression: v.nullish(v.string()),
	Limit: v.nullish(
		v.pipe(
			v.number(),
			v.integer(),
			v.minValue(1, "Limit must be greater than or equal to 1"),
		),
	),
	Select: v.nullish(
		v.picklist([
			"ALL_ATTRIBUTES",
			"ALL_PROJECTED_ATTRIBUTES",
			"COUNT",
			"SPECIFIC_ATTRIBUTES",
		]),
	),
	ExpressionAttributeNames: v.nullish(
		v.pipe(
			v.record(v.pipe(v.string(), v.regex(/^#[0-9a-zA-Z_]+$/)), v.string()),
			atLeastOneItem,
		),
	),
	ExpressionAttributeValues: v.nullish(
		v.record(
			v.pipe(v.string(), v.regex(/^:[0-9a-zA-Z_]+$/)),
			attributeValueSchema,
		),
	),
});
type ScanInput = v.InferOutput<typeof schema>;

export const validateInput = (data: unknown): ScanInput => {
	const result = v.safeParse(schema, data);
	if (!result.success) {
		throw validationException(result.issues[0].message);
	}

	const validInput = result.output;
	validateExpressionParams(
		validInput,
		["ProjectionExpression", "FilterExpression"],
		["AttributesToGet"],
	);
	validateExpressions(validInput);

	return validInput;
};
