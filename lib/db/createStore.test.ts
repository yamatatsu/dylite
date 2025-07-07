import { AbstractLevel, AbstractSublevel } from "abstract-level";
import { TableStore, createStore } from "./createStore";
import type { ITableStore, Store } from "./types";

let store: Store;
let tableStore: ITableStore;
beforeEach(async () => {
	store = createStore({});
	tableStore = store.tableStore;
});
afterEach(async () => {
	await store.db.close();
});

describe("createStore", () => {
	it("should create a store", () => {
		expect(store).toEqual(
			expect.objectContaining({
				awsAccountId: "000000000000",
				awsRegion: "us-east-1",
				options: {
					path: null,
					createTableMs: 500,
					deleteTableMs: 500,
					updateTableMs: 500,
					maxItemSizeKb: 400,
					maxItemSize: 409600,
				},
				db: expect.any(AbstractLevel),
				tableStore: expect.any(TableStore),
				getItemDb: expect.any(Function),
				deleteItemDb: expect.any(Function),
				getIndexDb: expect.any(Function),
				deleteIndexDb: expect.any(Function),
				getTagDb: expect.any(Function),
				deleteTagDb: expect.any(Function),
			}),
		);
	});
});

describe("getItemDb", () => {
	it("should get a Sublevel", () => {
		const itemDb = store.getItemDb("test");
		expect(itemDb).toEqual(expect.any(AbstractSublevel));
		expect(itemDb.prefix).toEqual("!item-test!");
	});
});

describe("deleteItemDb", () => {
	it("should delete a Sublevel", async () => {
		const itemDb = store.getItemDb("test");
		await itemDb.put("a", { a: { N: "1" } });
		expect(await itemDb.get("a")).toEqual({ a: { N: "1" } });

		await store.deleteItemDb("test");
		expect(await itemDb.get("a")).toBeUndefined();
	});
});

describe("getIndexDb", () => {
	it("should get a Sublevel", () => {
		const indexDb = store.getIndexDb("GSI", "test-table", "test-index");
		expect(indexDb).toEqual(expect.any(AbstractSublevel));
		expect(indexDb.prefix).toEqual("!index-gsi~test-table~test-index!");
	});
});

describe("deleteIndexDb", () => {
	it("should delete a Sublevel", async () => {
		const indexDb = store.getIndexDb("GSI", "test-table", "test-index");
		await indexDb.put("a", { a: { N: "1" } });
		expect(await indexDb.get("a")).toEqual({ a: { N: "1" } });

		await store.deleteIndexDb("GSI", "test-table", "test-index");
		expect(await indexDb.get("a")).toBeUndefined();
	});
});

describe("getTagDb", () => {
	it("should get a Sublevel", () => {
		const tagDb = store.getTagDb("test");
		expect(tagDb).toEqual(expect.any(AbstractSublevel));
		expect(tagDb.prefix).toEqual("!tag-test!");
	});
});

describe("deleteTagDb", () => {
	it("should delete a Sublevel", async () => {
		const tagDb = store.getTagDb("test");
		await tagDb.put("a", { a: { N: "1" } });
		expect(await tagDb.get("a")).toEqual({ a: { N: "1" } });

		await store.deleteTagDb("test");
		expect(await tagDb.get("a")).toBeUndefined();
	});
});
