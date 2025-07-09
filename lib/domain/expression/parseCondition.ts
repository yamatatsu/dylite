import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { compare } from "../../db/compare";
import conditionParser from "./condition-grammar";
import isReserved from "./isReserved";

export function parseCondition(
	expression: string,
	options: {
		ExpressionAttributeNames: QueryCommandInput["ExpressionAttributeNames"];
		ExpressionAttributeValues: QueryCommandInput["ExpressionAttributeValues"];
	},
) {
	const context = {
		attrNames: options.ExpressionAttributeNames,
		attrVals: options.ExpressionAttributeValues,
		/**
		 * Before parsing, it have all ExpressionAttributeNames.
		 * After parsing, attribute name used in the expression will be removed from this object.
		 */
		unusedAttrNames: replaceRecordValueToTrue(options.ExpressionAttributeNames),
		/**
		 * Before parsing, it have all ExpressionAttributeValues.
		 * After parsing, attribute value used in the expression will be removed from this object.
		 */
		unusedAttrVals: replaceRecordValueToTrue(options.ExpressionAttributeValues),
		isReserved,
		compare,
	};
	return conditionParser.parse(expression, { context });
}

///////////////////
// libs

function replaceRecordValueToTrue(
	record: Record<string, unknown> | undefined | null,
): Record<string, boolean> {
	if (!record) {
		return {};
	}
	return Object.keys(record).reduce(
		(acc, key) => {
			acc[key] = true;
			return acc;
		},
		{} as Record<string, boolean>,
	);
}
