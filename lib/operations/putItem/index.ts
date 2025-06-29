import * as v from "valibot";
import { createKey } from "../../db/createKey";
import { conditionalError, validationException } from "../../db/errors";
import type { Store } from "../../db/types";
import { updateIndexes } from "../../db/updateIndexes";
import { getMetadata } from "../common";
import { custom, schema } from "./schema";

export async function execute(json: unknown, store: Store) {
	const res = v.safeParse(schema, json);
	if (!res.success) {
		throw validationException(res.issues[0].message);
	}

	const msg = custom(res.output, store);
	if (msg) {
		if (msg === "The conditional request failed") {
			throw conditionalError();
		}
		throw validationException(msg);
	}

	const data = res.output;
	const table = await store.getTable(data.TableName);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}
	const itemDb = store.getItemDb(data.TableName);

	// Validate item has all key attributes
	for (const keyDef of table.KeySchema) {
		if (!data.Item[keyDef.AttributeName]) {
			throw validationException(
				"One of the required keys was not given a value",
			);
		}
	}

	const key = createKey(data.Item, table.AttributeDefinitions, table.KeySchema);

	// Fetch old item (if any)
	const oldItem = await itemDb.get(key);

	// If ConditionExpression is present and fails, throw conditionalError
	// (custom already checks this, but double-check for clarity)
	// Put new item
	await itemDb.put(key, data.Item);

	// Update indexes
	await updateIndexes(store, table, oldItem ?? null, data.Item);

	if (data.ReturnValues === "ALL_OLD" && oldItem) {
		return { Attributes: oldItem, $metadata: getMetadata() };
	}

	return { $metadata: getMetadata() };
}
