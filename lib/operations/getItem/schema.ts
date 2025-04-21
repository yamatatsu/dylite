import * as v from "valibot";
import { attributeValueSchema } from "../../validations/attributeValueSchema";
import { atLeastOneItem, unique } from "../../validations/util-validations";
import { validateExpressionParams } from "../../validations/validateExpressionParams";
import { validateExpressions } from "../../validations/validateExpressions";
import { tableNameSchema } from "../common-schema";

export const schema = v.object({
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

export const custom = (data: GetItemInput) => {
	let msg: string | undefined;

	msg = validateExpressionParams(
		data,
		["ProjectionExpression"],
		["AttributesToGet"],
	);
	if (msg) return msg;

	msg = validateExpressions(data);
	if (msg) return msg;
};
