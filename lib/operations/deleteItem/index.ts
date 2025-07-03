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

	const msg = custom(res.output);
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
	const key = createKey(data.Key, table.AttributeDefinitions, table.KeySchema);
	const oldItem = await itemDb.get(key);

	if (!oldItem) {
		return { $metadata: getMetadata() };
	}

	await itemDb.del(key);
	await updateIndexes(store, table, oldItem, null);

	if (data.ReturnValues === "ALL_OLD") {
		return { Attributes: oldItem, $metadata: getMetadata() };
	}

	return { $metadata: getMetadata() };
}
