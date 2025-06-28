import { randomUUID } from "node:crypto";
import * as v from "valibot";
import { createKey } from "../../db/createKey";
import type { Store } from "../../db/types";
import { updateIndexes } from "../../db/updateIndexes";
import { custom, schema } from "./schema";

export async function execute(json: unknown, store: Store) {
	const res = v.safeParse(schema, json);
	if (!res.success) {
		return res.issues[0].message;
	}

	const msg = custom(res.output, store);
	if (msg) return msg;

	const data = res.output;
	const table = await store.getTable(data.TableName);
	const itemDb = store.getItemDb(data.TableName);
	const key = createKey(data.Item, table.AttributeDefinitions, table.KeySchema);

	// Fetch old item (if any)
	const oldItem = await itemDb.get(key);

	// Put new item
	await itemDb.put(key, data.Item);

	// Update indexes
	await updateIndexes(store, table, oldItem ?? null, data.Item);

	const $metadata = {
		attempts: 1,
		cfId: undefined,
		extendedRequestId: undefined,
		httpStatusCode: 200,
		requestId: randomUUID(),
		totalRetryDelay: 0,
	};

	if (data.ReturnValues === "ALL_OLD" && oldItem) {
		return { Attributes: oldItem, $metadata };
	}
	return { $metadata };
}
