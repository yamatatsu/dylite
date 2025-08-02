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

	const keyAttributes = new Item(input.Key);
	const item = await table.getItem(keyAttributes);

	if (item) {
		return { Item: item.toPlain(), $metadata: getMetadata() };
	}
	return { $metadata: getMetadata() };
}
