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

	const item = new Item(input.Item);
	const oldItem = await table.putItem(item);

	if (input.ReturnValues === "ALL_OLD" && oldItem) {
		return { Attributes: oldItem.toPlain(), $metadata: getMetadata() };
	}

	return { $metadata: getMetadata() };
}
