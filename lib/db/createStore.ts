import { Level } from "level";
import { MemoryLevel } from "memory-level";
import { notFoundError } from "./errors";
import type { Item, Store, StoreOptions, SubDB, Table } from "./types";

export const MAX_SIZE = 409600; // TODO: get rid of this? or leave for backwards compat?

export function createStore(options: StoreOptions = {}): Store {
	const defaultOptions = {
		createTableMs: 500,
		deleteTableMs: 500,
		updateTableMs: 500,
		maxItemSizeKb: MAX_SIZE / 1024,
		...options,
	} satisfies StoreOptions;
	defaultOptions.maxItemSize = defaultOptions.maxItemSizeKb * 1024;

	const db = defaultOptions.path
		? new Level(defaultOptions.path)
		: new MemoryLevel();
	const subDbs: Record<string, SubDB> = {};
	const tableDb = getSubDb<Table>("table");

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

	async function getTable(
		name: string,
		checkStatus = true,
	): Promise<Table | null> {
		const table = await tableDb.get(name);
		if (
			checkStatus &&
			(table?.TableStatus === "CREATING" || table?.TableStatus === "DELETING")
		) {
			throw notFoundError(checkStatus);
		}
		return table ?? null;
	}

	return {
		awsAccountId: awsAccountId,
		awsRegion: awsRegion,
		options: defaultOptions,
		db,
		tableDb,
		getItemDb,
		deleteItemDb,
		getIndexDb,
		deleteIndexDb,
		getTagDb,
		deleteTagDb,
		getTable,
	};
}
