import * as v from "valibot";
import { attributeValueSchema } from "./attributeValueSchema";
import { expectedSchema, validateAttributeConditions } from "./expectedSchema";
import { validateExpressionParams } from "./validateExpressionParams";
import { validateExpressions } from "./validateExpressions";

export const schema = v.object({
	ReturnConsumedCapacity: v.nullish(v.picklist(["INDEXES", "TOTAL", "NONE"])),
	TableName: v.pipe(
		v.string(),
		v.regex(/^[a-zA-Z0-9_.-]+$/),
		v.minLength(3),
		v.maxLength(255),
	),
	ReturnValues: v.nullish(
		v.picklist(["ALL_NEW", "UPDATED_OLD", "ALL_OLD", "NONE", "UPDATED_NEW"]),
	),
	ReturnItemCollectionMetrics: v.nullish(v.picklist(["SIZE", "NONE"])),
	Key: v.record(v.string(), attributeValueSchema),
	ConditionalOperator: v.nullish(v.picklist(["OR", "AND"])),
	Expected: expectedSchema,
	ConditionExpression: v.nullish(v.string()),
	ExpressionAttributeValues: v.nullish(
		v.record(v.string(), attributeValueSchema),
	),
	ExpressionAttributeNames: v.nullish(v.record(v.string(), v.string())),
});
type DeleteItemInput = v.InferOutput<typeof schema>;

export const custom = (data: DeleteItemInput) => {
	let msg = validateExpressionParams(
		data,
		["ConditionExpression"],
		["Expected"],
	);
	if (msg) return msg;

	msg = validateAttributeConditions(data);
	if (msg) return msg;

	msg = validateExpressions(data);
	if (msg) return msg;
};
