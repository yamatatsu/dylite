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

	const items = await table.scanItems();
	const limit = input.Limit;
	
	let resultItems = items;
	let lastEvaluatedKey = undefined;
	
	if (limit && items.length > limit) {
		resultItems = items.slice(0, limit);
		// Generate LastEvaluatedKey from the last returned item
		const lastItem = resultItems[resultItems.length - 1];
		lastEvaluatedKey = table.description.getKeyAttributes(lastItem).toPlain();
	}
	
	const plainItems = resultItems.map((item) => item.toPlain());

	const result: any = {
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
