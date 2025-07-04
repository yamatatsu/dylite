import * as v from "valibot";
import { validationException } from "../../db/errors";
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
	Key: v.record(v.string(), attributeValueSchema),
	ConsistentRead: v.nullish(v.boolean()),
	ProjectionExpression: v.nullish(v.string()),
	ExpressionAttributeNames: v.nullish(
		v.pipe(
			v.record(v.pipe(v.string(), v.regex(/^#[0-9a-zA-Z_]+$/)), v.string()),
			atLeastOneItem,
		),
	),
});
type GetItemInput = v.InferOutput<typeof schema>;

export const validateInput = (data: unknown): GetItemInput => {
	const result = v.safeParse(schema, data);
	if (!result.success) {
		throw validationException(result.issues[0].message);
	}

	const validInput = result.output;
	validateExpressionParams(
		validInput,
		["ProjectionExpression"],
		["AttributesToGet"],
	);
	validateExpressions(validInput);

	return validInput;
};
