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
	 * Returns items and information about the next item for pagination.
	 * @param limit - Maximum number of items to return (optional)
	 * @param exclusiveStartKey - Item to start scanning after (for pagination)
	 * @returns Object containing:
	 *   - items: Array of items found (up to limit)
	 *   - nextItem: The next item that would be returned if continuing scan (undefined if no more items)
	 */
	async scanItems(
		limit?: number | null,
		exclusiveStartKey?: Item,
	): Promise<{ items: Item[]; nextItem: Item | undefined }> {
		const items: Item[] = [];
		let nextItem: Item | undefined;
		let startKeyStr: string | undefined;
		let foundStartPosition = false;

		if (exclusiveStartKey) {
			startKeyStr = this.description.getKeyStr(exclusiveStartKey);
			// If we have a start key, we need to find it first
			foundStartPosition = false;
		} else {
			// No start key, start from beginning
			foundStartPosition = true;
		}

		for await (const [key, plainItem] of this.mainIndex.iterator()) {
			const item = new Item(plainItem);
			const currentKeyStr = this.description.getKeyStr(item);

			// Skip items until we pass the exclusive start key
			if (!foundStartPosition) {
				if (currentKeyStr === startKeyStr) {
					foundStartPosition = true;
				}
				continue;
			}

			if (limit && items.length >= limit) {
				nextItem = item;
				break;
			}

			items.push(item);
		}

		return { items, nextItem };
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
