import { createIndexKey } from "./createIndexKey";
import type {
	Index,
	IndexAction,
	IndexActions,
	Item,
	Store,
	Table,
} from "./types";

export async function updateIndexes(
	store: Store,
	table: Table,
	existingItem: Item | null,
	item: Item | null,
): Promise<void> {
	if (!existingItem && !item) {
		return;
	}

	const gsiList = table.GlobalSecondaryIndexes ?? [];
	const lsiList = table.LocalSecondaryIndexes ?? [];

	const gsiActions = getIndexActions(gsiList, existingItem, item, table);
	const lsiActions = getIndexActions(lsiList, existingItem, item, table);

	await Promise.all([
		...putIndexesByActions(store, table, gsiActions.puts, "Global"),
		...putIndexesByActions(store, table, lsiActions.puts, "Local"),
	]);

	await Promise.all([
		...deleteIndexesByActions(store, table, gsiActions.deletes, "Global"),
		...deleteIndexesByActions(store, table, lsiActions.deletes, "Local"),
	]);
}

function putIndexesByActions(
	store: Store,
	table: Table,
	actions: IndexAction[],
	indexType: string,
) {
	return actions.map((action) => {
		const indexDb = store.getIndexDb(indexType, table.TableName, action.index);
		return action.item && indexDb.put(action.key, action.item);
	});
}

function deleteIndexesByActions(
	store: Store,
	table: Table,
	actions: IndexAction[],
	indexType: string,
) {
	return actions.map((action) => {
		const indexDb = store.getIndexDb(indexType, table.TableName, action.index);
		return indexDb.del(action.key);
	});
}

function getIndexActions(
	indexes: Index[],
	existingItem: Item | null,
	item: Item | null,
	table: Table,
): IndexActions {
	const puts: IndexAction[] = [];
	const deletes: IndexAction[] = [];
	const tableKeys = table.KeySchema.map((key) => key.AttributeName);

	for (const index of indexes) {
		const {
			IndexName: indexName,
			KeySchema: keySchema,
			Projection: projection,
		} = index;

		const indexKeys = keySchema.map((key) => key.AttributeName);
		let key: string | null = null;

		if (item && isItemIncludesAllIndexKeys(item, indexKeys)) {
			const itemPieces =
				projection.ProjectionType === "ALL"
					? item
					: pick(
							item,
							indexKeys.concat(tableKeys, projection.NonKeyAttributes ?? []),
						);

			key = createIndexKey(itemPieces, table, keySchema);
			puts.push({ index: indexName, key, item: itemPieces });
		}

		if (existingItem && isItemIncludesAllIndexKeys(existingItem, indexKeys)) {
			const existingKey = createIndexKey(existingItem, table, keySchema);
			if (existingKey !== key) {
				deletes.push({ index: indexName, key: existingKey });
			}
		}
	}

	return { puts, deletes };
}

function pick(item: Item, indexKeys: string[]): Item {
	const picked: Item = {};
	for (const key of indexKeys) {
		picked[key] = item[key];
	}
	return picked;
}

function isItemIncludesAllIndexKeys(item: Item, indexKeys: string[]): boolean {
	return indexKeys.every((key) => item[key] != null);
}
