import { createKey } from "../../db/createKey";
import { validationException } from "../../db/errors";
import type { Store } from "../../db/types";
import { getMetadata } from "../common";
import { validateInput } from "./schema";

export async function execute(json: unknown, store: Store) {
	const input = validateInput(json);
	const tableStore = store.tableStore;

	const table = await tableStore.get(input.TableName);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}
	const itemDb = store.getItemDb(input.TableName);
	const key = createKey(input.Key, table.AttributeDefinitions, table.KeySchema);
	const item = await itemDb.get(key);

	if (item) {
		return { Item: item, $metadata: getMetadata() };
	}
	return { $metadata: getMetadata() };
}
