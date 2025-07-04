import { createKey } from "../../db/createKey";
import { validationException } from "../../db/errors";
import type { Store } from "../../db/types";
import { updateIndexes } from "../../db/updateIndexes";
import { getMetadata } from "../common";
import { validateInput } from "./schema";

export async function execute(json: unknown, store: Store) {
	const input = validateInput(json, store);

	const table = await store.getTable(input.TableName);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}
	const itemDb = store.getItemDb(input.TableName);

	// Validate item has all key attributes
	for (const keyDef of table.KeySchema) {
		if (!input.Item[keyDef.AttributeName]) {
			throw validationException(
				"One of the required keys was not given a value",
			);
		}
	}

	const key = createKey(
		input.Item,
		table.AttributeDefinitions,
		table.KeySchema,
	);

	// Fetch old item (if any)
	const oldItem = await itemDb.get(key);

	// If ConditionExpression is present and fails, throw conditionalError
	// (custom already checks this, but double-check for clarity)
	// Put new item
	await itemDb.put(key, input.Item);

	// Update indexes
	await updateIndexes(store, table, oldItem ?? null, input.Item);

	if (input.ReturnValues === "ALL_OLD" && oldItem) {
		return { Attributes: oldItem, $metadata: getMetadata() };
	}

	return { $metadata: getMetadata() };
}
