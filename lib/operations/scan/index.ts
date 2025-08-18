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
	const plainItems = items.map((item) => item.toPlain());

	return {
		Items: plainItems,
		Count: plainItems.length,
		ScannedCount: plainItems.length,
		$metadata: getMetadata(),
	};
}
