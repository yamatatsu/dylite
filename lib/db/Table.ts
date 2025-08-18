import type { AbstractLevel, AbstractSublevel } from "abstract-level";
import type { MemoryLevel } from "memory-level";
import { Item, type PlainItem } from "../domain/Item";
import type { TableDescription } from "../domain/TableDescription";

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

	/**
	 * Scan items from the table with optional limit and starting point.
	 * Returns items and information about whether more items exist for pagination.
	 * @param limit - Maximum number of items to return (optional)
	 * @param exclusiveStartKey - Item to start scanning after (for pagination)
	 * @returns Object containing:
	 *   - items: Array of items found (up to limit)
	 *   - existsMore: Whether more items exist beyond the returned set
	 */
	async scanItems(
		limit?: number | null,
		exclusiveStartKey?: Item,
	): Promise<{ items: Item[]; existsMore: boolean }> {
		const items: Item[] = [];

		const option = exclusiveStartKey
			? { gt: this.description.getKeyStr(exclusiveStartKey) }
			: {};

		for await (const plainItem of this.mainIndex.values(option)) {
			const item = new Item(plainItem);

			items.push(item);

			if (limit && items.length >= limit) {
				return { items, existsMore: true };
			}
		}

		return { items, existsMore: false };
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
