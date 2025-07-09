import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import isReserved from "./isReserved";
import projectionParser from "./projection-grammar";

export function parseProjection(
	expression: string,
	options: {
		ExpressionAttributeNames: QueryCommandInput["ExpressionAttributeNames"];
	},
) {
	const context = {
		attrNames: options.ExpressionAttributeNames,
		/**
		 * Before parsing, it have all ExpressionAttributeNames.
		 * After parsing, attribute name used in the expression will be removed from this object.
		 */
		unusedAttrNames: replaceRecordValueToTrue(options.ExpressionAttributeNames),
		isReserved,
	};
	return projectionParser.parse(expression, { context });
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
