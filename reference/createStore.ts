import AsyncLock from "async-lock";
import { Level } from "level";
import { MemoryLevel } from "memory-level";
import type {
	ITableStore,
	Item,
	Store,
	StoreOptions,
	StoreOptionsInput,
	SubDB,
	TableDefinition,
} from "./types";

export const MAX_SIZE = 409600; // TODO: get rid of this? or leave for backwards compat?

export function createStore(options: StoreOptionsInput = {}): Store {
	const defaultOptions = {
		path: options.path ?? null,
		createTableMs: options.createTableMs ?? 500,
		deleteTableMs: options.deleteTableMs ?? 500,
		updateTableMs: options.updateTableMs ?? 500,
		maxItemSizeKb: options.maxItemSizeKb ?? MAX_SIZE / 1024,
		maxItemSize: (options.maxItemSizeKb ?? MAX_SIZE / 1024) * 1024,
	} satisfies StoreOptions;

	const db = defaultOptions.path
		? new Level(defaultOptions.path)
		: new MemoryLevel();
	const subDbs: Record<string, SubDB> = {};

	const awsAccountId = process.env.AWS_ACCOUNT_ID || "000000000000";
	const awsRegion =
		process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

	function getItemDb(name: string): SubDB<Item> {
		return getSubDb<Item>(`item-${name}`);
	}

	async function deleteItemDb(name: string): Promise<void> {
		await deleteSubDb(`item-${name}`);
	}

	function getIndexDb(
		indexType: string,
		tableName: string,
		indexName: string,
	): SubDB<Item> {
		return getSubDb<Item>(
			`index-${indexType.toLowerCase()}~${tableName}~${indexName}`,
		);
	}

	async function deleteIndexDb(
		indexType: string,
		tableName: string,
		indexName: string,
	): Promise<void> {
		await deleteSubDb(
			`index-${indexType.toLowerCase()}~${tableName}~${indexName}`,
		);
	}

	function getTagDb(name: string): SubDB<Item> {
		return getSubDb<Item>(`tag-${name}`);
	}

	async function deleteTagDb(name: string): Promise<void> {
		await deleteSubDb(`tag-${name}`);
	}

	function getSubDb<Value>(name: string): SubDB<Value> {
		// biome-ignore format: needs `()` to make overload of `db.sublevel` work
		return (db.sublevel<string, Value>)(name, { valueEncoding: "json" });
	}

	async function deleteSubDb(name: string): Promise<void> {
		const subDb = getSubDb(name);
		await subDb.clear();
		delete subDbs[name];
	}

	return {
		awsAccountId: awsAccountId,
		awsRegion: awsRegion,
		options: defaultOptions,
		db,
		tableStore: TableStore.create(db),
		tableLock: new AsyncLock(),
		getItemDb,
		deleteItemDb,
		getIndexDb,
		deleteIndexDb,
		getTagDb,
		deleteTagDb,
	};
}

export class TableStore implements ITableStore {
	public static create(_db: MemoryLevel | Level): TableStore {
		// biome-ignore format: needs `()` to make overload of `db.sublevel` work
		const db = (_db.sublevel<string, TableDefinition>)("table", { valueEncoding: "json" });
		return new TableStore(db);
	}

	constructor(private db: SubDB<TableDefinition>) {}

	async tableNames(options?: {
		limit?: number;
		exclusiveStartTableName?: string;
	}) {
		const { limit = 100, exclusiveStartTableName = "" } = options ?? {};

		const names: string[] = [];
		let lastEvaluatedTableName: string | undefined;
		for await (const table of this.db.keys({
			gt: exclusiveStartTableName,
		})) {
			if (names.length === limit) {
				lastEvaluatedTableName = names[names.length - 1];
				break;
			}
			names.push(table);
		}

		return [names, lastEvaluatedTableName] as const;
	}

	async get(name: string, checkStatus = true): Promise<TableDefinition | null> {
		const table = await this.db.get(name);
		if (
			(checkStatus &&
				(table?.TableStatus === "CREATING" ||
					table?.TableStatus === "DELETING")) ||
			!table
		) {
			return null;
		}
		return table;
	}

	async put(table: TableDefinition): Promise<void> {
		await this.db.put(table.TableName, table);
	}

	async delete(name: string): Promise<void> {
		await this.db.del(name);
	}
}

export class ItemStore {}

class LevelFactory {
	constructor(
		private db: Level<string, string> | MemoryLevel<string, string>,
	) {}

	sublevel<Value>(name: string): SubDB<Value> {
		// biome-ignore format: needs `()` to make overload of `db.sublevel` work
		return (this.db.sublevel<string, Value>)(name, { valueEncoding: "json" });
	}
}
