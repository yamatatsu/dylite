import { createKey } from "../../db/createKey";
import { validationException } from "../../db/errors";
import type { Store } from "../../db/types";
import { updateIndexes } from "../../db/updateIndexes";
import { getMetadata } from "../common";
import { validateInput } from "./schema";

export async function execute(json: unknown, store: Store) {
	const input = validateInput(json);

	const table = await store.getTable(input.TableName);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}
	const itemDb = store.getItemDb(input.TableName);
	const key = createKey(input.Key, table.AttributeDefinitions, table.KeySchema);
	const oldItem = await itemDb.get(key);

	if (!oldItem) {
		return { $metadata: getMetadata() };
	}

	await itemDb.del(key);
	await updateIndexes(store, table, oldItem, null);

	if (input.ReturnValues === "ALL_OLD") {
		return { Attributes: oldItem, $metadata: getMetadata() };
	}

	return { $metadata: getMetadata() };
}
