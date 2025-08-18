import type { TableMap } from "../../db/TableMap";
import { Item } from "../../domain/Item";
import { validationException } from "../../domain/errors";
import { getMetadata } from "../common";
import { validateInput } from "./schema";

export async function execute(json: unknown, tableMap: TableMap) {
	const input = validateInput(json);

	const table = tableMap.getTable(input.TableName);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}

	const exclusiveStartKey = input.ExclusiveStartKey
		? new Item(input.ExclusiveStartKey)
		: undefined;
	const scanResult = await table.scanItems(input.Limit, exclusiveStartKey);

	const resultItems = scanResult.items;
	const lastEvaluatedItem = scanResult.existsMore
		? resultItems[resultItems.length - 1]
		: undefined;

	const plainItems = resultItems.map((item) => item.toPlain());

	const result = {
		Items: plainItems,
		Count: plainItems.length,
		ScannedCount: plainItems.length,
		$metadata: getMetadata(),
	};

	if (!lastEvaluatedItem) {
		return result;
	}

	return {
		...result,
		LastEvaluatedKey: table.description
			.getKeyAttributes(lastEvaluatedItem)
			.toPlain(),
	};
}
