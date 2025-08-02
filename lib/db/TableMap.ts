import type { AbstractLevel, AbstractSublevel } from "abstract-level";
import type { MemoryLevel } from "memory-level";
import { Item, type PlainItem } from "../domain/Item";
import type { TableDescription } from "../domain/TableDescription";
import { resourceInUseException, validationException } from "../domain/errors";

export class TableMap {
	private readonly map = new Map<string, Table>();

	constructor(private readonly level: MemoryLevel) {}

	getTable(tableName: string): Table | null {
		const table = this.map.get(tableName);
		return table ?? null;
	}
	addTable(description: TableDescription): void {
		if (this.map.has(description.tableName)) {
			throw resourceInUseException("");
		}
		const table = new Table(this.level, description);
		this.map.set(table.tableName, table);
	}
	listTableNames(): string[] {
		return Array.from(this.map.keys());
	}
	async deleteTable(tableName: string): Promise<Table> {
		const table = this.map.get(tableName);
		if (!table) {
			throw validationException("Cannot do operations on a non-existent table");
		}
		this.map.delete(tableName);
		return table;
	}
}

export type Format = string | Buffer | Uint8Array;
export type DB = AbstractLevel<Format, string, string>;
export type ItemStore = AbstractSublevel<DB, Format, string, PlainItem>;

export class Table {
	private readonly baseStore: AbstractSublevel<DB, Format, string, string>;
	private readonly indices = new Map<string, ItemStore>();

	constructor(
		level: MemoryLevel,
		public readonly description: TableDescription,
	) {
		this.baseStore = level.sublevel<string, string>(description.tableName, {
			valueEncoding: "json",
		});
		this.addIndex("main");
	}

	get tableName(): string {
		return this.description.tableName;
	}
	get mainIndex(): ItemStore {
		// biome-ignore lint/style/noNonNullAssertion: must have main index
		return this.indices.get("main")!;
	}

	/**
	 * TODO: update indexes after putItem
	 */
	async putItem(item: Item): Promise<Item | null> {
		const oldPlainItem = await this.getItem(item);

		const keyStr = this.description.getKeyStr(item);
		await this.mainIndex.put(keyStr, item.toPlain());

		return oldPlainItem;
	}

	/**
	 * TODO: update indexes after putItem
	 */
	async deleteItem(keyAttributes: Item): Promise<Item | null> {
		const oldPlainItem = await this.getItem(keyAttributes);

		const keyStr = this.description.getKeyStr(keyAttributes);
		await this.mainIndex.del(keyStr);

		return oldPlainItem;
	}

	async getItem(keyAttributes: Item): Promise<Item | null> {
		const key = this.description.getKeyStr(keyAttributes);
		const plainItem = await this.mainIndex.get(key);
		return plainItem ? new Item(plainItem) : null;
	}

	private addIndex(name: string): void {
		if (this.indices.has(name)) {
			throw new Error(`Index ${name} already exists`);
		}
		const index = this.baseStore.sublevel<string, PlainItem>(name, {
			valueEncoding: "json",
		});
		this.indices.set(name, index);
	}
}
