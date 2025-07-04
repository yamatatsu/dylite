import * as v from "valibot";
import { validationException } from "../../db/errors";
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

export const validateInput = (data: unknown): DeleteItemInput => {
	const result = v.safeParse(schema, data);
	if (!result.success) {
		throw validationException(result.issues[0].message);
	}

	const validInput = result.output;

	validateExpressionParams(validInput, ["ConditionExpression"], ["Expected"]);
	validateAttributeConditions(validInput);
	validateExpressions(validInput);

	return validInput;
};
