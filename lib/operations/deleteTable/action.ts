import type { Store } from "../../db/types";
import { validationException } from "../../domain/errors";
import type { Schema } from "./schema";

export async function action(store: Store, data: Schema) {
	const key = data.TableName;
	const tableStore = store.tableStore;

	const table = await tableStore.get(key, false);
	if (!table) {
		throw validationException("Cannot do operations on a non-existent table");
	}

	// Check if table is ACTIVE or not?
	if (table.TableStatus === "CREATING") {
		return {
			statusCode: 400,
			body: {
				__type: "com.amazonaws.dynamodb.v20120810#ResourceInUseException",
				message: `Attempt to change a resource which is still in use: Table is being created: ${key}`,
			},
		};
	}

	const _table = {
		...table,
		TableStatus: "ACTIVE",
		GlobalSecondaryIndexes: undefined,
	} as const;
	await tableStore.put(_table);

	await Promise.all([
		store.deleteItemDb(key),
		store.deleteTagDb(key),
		...(table.LocalSecondaryIndexes?.map((index) =>
			store.deleteIndexDb("Local", table.TableName, index.IndexName),
		) || []),
		...(table.GlobalSecondaryIndexes?.map((index) =>
			store.deleteIndexDb("Global", table.TableName, index.IndexName),
		) || []),
	]);

	// without await intentionally
	tableStore.delete(key);

	return { TableDescription: _table };
}
