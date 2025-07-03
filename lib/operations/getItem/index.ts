import * as v from "valibot";
import { createKey } from "../../db/createKey";
import { validationException } from "../../db/errors";
import type { Store } from "../../db/types";
import { getMetadata } from "../common";
import { custom, schema } from "./schema";

export async function execute(json: unknown, store: Store) {
	const res = v.safeParse(schema, json);
	if (!res.success) {
		throw validationException(res.issues[0].message);
	}

	const msg = custom(res.output);
	if (msg) throw validationException(msg);

	const cmd = res.output;
	const table = await store.getTable(cmd.TableName);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}
	const itemDb = store.getItemDb(cmd.TableName);
	const key = createKey(cmd.Key, table.AttributeDefinitions, table.KeySchema);
	const item = await itemDb.get(key);

	if (item) {
		return { Item: item, $metadata: getMetadata() };
	}
	return { $metadata: getMetadata() };
}
