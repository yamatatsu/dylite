import * as v from "valibot";
import { itemSize } from "../../db/itemSize";
import type { Store } from "../../db/types";
import { attributeValueSchema } from "../../validations/attributeValueSchema";
import { validateExpressionParams } from "../../validations/validateExpressionParams";
import { validateExpressions } from "../../validations/validateExpressions";
import { tableNameSchema } from "../common-schema";
import {
	expectedSchema,
	validateAttributeConditions,
} from "../common-schema/expectedSchema";

export const schema = v.object({
	ReturnConsumedCapacity: v.nullish(v.picklist(["INDEXES", "TOTAL", "NONE"])),
	TableName: tableNameSchema("TableName"),
	Item: v.record(v.string(), attributeValueSchema),
	ConditionalOperator: v.nullish(v.picklist(["OR", "AND"])),
	Expected: expectedSchema,
	ReturnValues: v.nullish(
		v.picklist(["ALL_NEW", "UPDATED_OLD", "ALL_OLD", "NONE", "UPDATED_NEW"]),
	),
	ReturnItemCollectionMetrics: v.nullish(v.picklist(["SIZE", "NONE"])),
	ConditionExpression: v.nullish(v.string()),
	ExpressionAttributeValues: v.nullish(
		v.record(v.string(), attributeValueSchema),
	),
	ExpressionAttributeNames: v.nullish(v.record(v.string(), v.string())),
});
type PutItemInput = v.InferOutput<typeof schema>;

export const custom = (data: PutItemInput, store: Store) => {
	let msg = validateExpressionParams(
		data,
		["ConditionExpression"],
		["Expected"],
	);
	if (msg) return msg;

	if (
		data.ReturnValues &&
		data.ReturnValues !== "ALL_OLD" &&
		data.ReturnValues !== "NONE"
	)
		return "ReturnValues can only be ALL_OLD or NONE";

	if (itemSize(data.Item) > store.options.maxItemSize)
		return "Item size has exceeded the maximum allowed size";

	msg = validateAttributeConditions(data);
	if (msg) return msg;

	msg = validateExpressions(data);
	if (msg) return msg;
};
