import * as v from "valibot";
import { validationException } from "../../db/errors";
import { itemSize } from "../../db/itemSize";
import type { Store } from "../../db/types";
import { attributeValueSchema } from "../../validations/attributeValueSchema";
import { validateExpressionParams } from "../../validations/validateExpressionParams";
import { validateExpressions } from "../../validations/validateExpressions";
import {
	expectedSchema,
	tableNameSchema,
	validateAttributeConditions,
} from "../common";

const schema = v.object({
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

export const validateInput = (data: unknown): PutItemInput => {
	const result = v.safeParse(schema, data);
	if (!result.success) {
		throw validationException(result.issues[0].message);
	}

	const validInput = result.output;
	validateExpressionParams(validInput, ["ConditionExpression"], ["Expected"]);

	if (
		validInput.ReturnValues &&
		validInput.ReturnValues !== "ALL_OLD" &&
		validInput.ReturnValues !== "NONE"
	)
		throw validationException("Return values set to invalid value");

	// TODO: implement item size validation
	// if (itemSize(validInput.Item) > store.options.maxItemSize)
	// 	throw validationException(
	// 		"Item size has exceeded the maximum allowed size",
	// 	);

	validateAttributeConditions(validInput);

	validateExpressions(validInput);

	return validInput;
};
