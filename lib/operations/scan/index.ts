import type { TableMap } from "../../db/TableMap";
import { validationException } from "../../domain/errors";
import { getMetadata } from "../common";
import { validateInput } from "./schema";

export async function execute(json: unknown, tableMap: TableMap) {
	const input = validateInput(json);

	const table = tableMap.getTable(input.TableName);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}

	const scanResult = await table.scanItems(input.Limit);

	const resultItems = scanResult.items;
	let lastEvaluatedKey = undefined;

	if (scanResult.nextItem) {
		// Generate LastEvaluatedKey from the last returned item
		const lastItem = resultItems[resultItems.length - 1];
		lastEvaluatedKey = table.description.getKeyAttributes(lastItem).toPlain();
	}

	const plainItems = resultItems.map((item) => item.toPlain());

	const result: {
		Items: unknown[];
		Count: number;
		ScannedCount: number;
		$metadata: unknown;
		LastEvaluatedKey?: unknown;
	} = {
		Items: plainItems,
		Count: plainItems.length,
		ScannedCount: plainItems.length,
		$metadata: getMetadata(),
	};

	if (lastEvaluatedKey) {
		result.LastEvaluatedKey = lastEvaluatedKey;
	}

	return result;
}
