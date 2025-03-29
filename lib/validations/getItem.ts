import * as v from "valibot";
import { attributeValueSchema } from "./attributeValueSchema";
import { atLeastOneItem, unique } from "./util-validations";
import { validateExpressionParams } from "./validateExpressionParams";
import { validateExpressions } from "./validateExpressions";

export const schema = v.object({
	ReturnConsumedCapacity: v.nullish(v.picklist(["INDEXES", "TOTAL", "NONE"])),
	AttributesToGet: v.nullish(
		v.pipe(
			v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(255))),
			unique,
		),
	),
	TableName: v.pipe(
		v.string(),
		v.regex(/^[a-zA-Z0-9_.-]+$/),
		v.minLength(3),
		v.maxLength(255),
	),
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
