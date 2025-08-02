import { createStore } from "./createStore";
import type { Store, TableDefinition } from "./types";
import { updateIndexes } from "./updateIndexes";

const table = {
	TableName: "test",
	KeySchema: [
		{ AttributeName: "p_key", KeyType: "HASH" },
		{ AttributeName: "s_key", KeyType: "RANGE" },
	],
	AttributeDefinitions: [
		{ AttributeName: "p_key", AttributeType: "S" },
		{ AttributeName: "s_key", AttributeType: "S" },
		{ AttributeName: "gsi1_p_key", AttributeType: "S" },
		{ AttributeName: "gsi1_s_key", AttributeType: "S" },
		{ AttributeName: "gsi2_p_key", AttributeType: "S" },
		{ AttributeName: "gsi2_s_key", AttributeType: "S" },
		{ AttributeName: "lsi1_s_key", AttributeType: "S" },
		{ AttributeName: "lsi2_s_key", AttributeType: "S" },
	],
	GlobalSecondaryIndexes: [
		{
			IndexName: "test_gsi1",
			Projection: { ProjectionType: "ALL" },
			KeySchema: [
				{ AttributeName: "gsi1_p_key", KeyType: "HASH" },
				{ AttributeName: "gsi1_s_key", KeyType: "RANGE" },
			],
		},
		{
			IndexName: "test_gsi2",
			Projection: {
				ProjectionType: "INCLUDE",
				NonKeyAttributes: ["foo"],
			},
			KeySchema: [
				{ AttributeName: "gsi2_p_key", KeyType: "HASH" },
				{ AttributeName: "gsi2_s_key", KeyType: "RANGE" },
			],
		},
	],
	LocalSecondaryIndexes: [
		{
			IndexName: "test_lsi1",
			Projection: { ProjectionType: "ALL" },
			KeySchema: [{ AttributeName: "lsi1_s_key", KeyType: "RANGE" }],
		},
		{
			IndexName: "test_lsi2",
			Projection: {
				ProjectionType: "INCLUDE",
				NonKeyAttributes: ["bar"],
			},
			KeySchema: [{ AttributeName: "lsi2_s_key", KeyType: "RANGE" }],
		},
	],
} satisfies TableDefinition;

const simpleItem = {
	p_key: { S: "p_key_val" },
	s_key: { S: "s_key_val" },
	foo: { S: "foo_val" },
	bar: { S: "bar_val" },
	baz: { S: "baz_val" },
};
const fullItem = {
	p_key: { S: "p_key_val" },
	s_key: { S: "s_key_val" },
	gsi1_p_key: { S: "gsi1_p_key_val" },
	gsi1_s_key: { S: "gsi1_s_key_val" },
	gsi2_p_key: { S: "gsi2_p_key_val" },
	gsi2_s_key: { S: "gsi2_s_key_val" },
	lsi1_s_key: { S: "lsi1_s_key_val" },
	lsi2_s_key: { S: "lsi2_s_key_val" },
	foo: { S: "foo_val" },
	bar: { S: "bar_val" },
	baz: { S: "baz_val" },
};

let store: Store;
beforeEach(async () => {
	store = createStore();
});
afterEach(async () => {
	await store.db.close();
});

test("from no item to simpleItem", async () => {
	const gsi1Db = store.getIndexDb("Global", table.TableName, "test_gsi1");
	const gsi2Db = store.getIndexDb("Global", table.TableName, "test_gsi2");
	const lsi1Db = store.getIndexDb("Local", table.TableName, "test_lsi1");
	const lsi2Db = store.getIndexDb("Local", table.TableName, "test_lsi2");

	await updateIndexes(store, table, null, simpleItem);

	await expect(toArray(gsi1Db.iterator())).resolves.toEqual([]);
	await expect(toArray(gsi2Db.iterator())).resolves.toEqual([]);
	await expect(toArray(lsi1Db.iterator())).resolves.toEqual([]);
	await expect(toArray(lsi2Db.iterator())).resolves.toEqual([]);
});

test("from no item to fullItem", async () => {
	const gsi1Db = store.getIndexDb("Global", table.TableName, "test_gsi1");
	const gsi2Db = store.getIndexDb("Global", table.TableName, "test_gsi2");
	const lsi1Db = store.getIndexDb("Local", table.TableName, "test_lsi1");
	const lsi2Db = store.getIndexDb("Local", table.TableName, "test_lsi2");

	await updateIndexes(store, table, null, fullItem);

	await expect(toArray(gsi1Db.iterator())).resolves.toEqual([
		[
			"57e952/677369315f705f6b65795f76616c/677369315f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				gsi1_p_key: { S: "gsi1_p_key_val" },
				gsi1_s_key: { S: "gsi1_s_key_val" },
				gsi2_p_key: { S: "gsi2_p_key_val" },
				gsi2_s_key: { S: "gsi2_s_key_val" },
				lsi1_s_key: { S: "lsi1_s_key_val" },
				lsi2_s_key: { S: "lsi2_s_key_val" },
				foo: { S: "foo_val" },
				bar: { S: "bar_val" },
				baz: { S: "baz_val" },
			},
		],
	]);
	await expect(toArray(gsi2Db.iterator())).resolves.toEqual([
		[
			"56f148/677369325f705f6b65795f76616c/677369325f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				gsi2_p_key: { S: "gsi2_p_key_val" },
				gsi2_s_key: { S: "gsi2_s_key_val" },
				foo: { S: "foo_val" },
			},
		],
	]);
	await expect(toArray(lsi1Db.iterator())).resolves.toEqual([
		[
			"f993f5/6c7369315f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				gsi1_p_key: { S: "gsi1_p_key_val" },
				gsi1_s_key: { S: "gsi1_s_key_val" },
				gsi2_p_key: { S: "gsi2_p_key_val" },
				gsi2_s_key: { S: "gsi2_s_key_val" },
				lsi1_s_key: { S: "lsi1_s_key_val" },
				lsi2_s_key: { S: "lsi2_s_key_val" },
				foo: { S: "foo_val" },
				bar: { S: "bar_val" },
				baz: { S: "baz_val" },
			},
		],
	]);
	await expect(toArray(lsi2Db.iterator())).resolves.toEqual([
		[
			"955cd8/6c7369325f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				lsi2_s_key: { S: "lsi2_s_key_val" },
				bar: { S: "bar_val" },
			},
		],
	]);
});

test("from fullItem to simpleItem", async () => {
	const gsi1Db = store.getIndexDb("Global", table.TableName, "test_gsi1");
	const gsi2Db = store.getIndexDb("Global", table.TableName, "test_gsi2");
	const lsi1Db = store.getIndexDb("Local", table.TableName, "test_lsi1");
	const lsi2Db = store.getIndexDb("Local", table.TableName, "test_lsi2");

	await updateIndexes(store, table, null, fullItem);
	await updateIndexes(store, table, fullItem, simpleItem);

	await expect(toArray(gsi1Db.iterator())).resolves.toEqual([]);
	await expect(toArray(gsi2Db.iterator())).resolves.toEqual([]);
	await expect(toArray(lsi1Db.iterator())).resolves.toEqual([]);
	await expect(toArray(lsi2Db.iterator())).resolves.toEqual([]);
});

test("from fullItem to fullItem", async () => {
	const gsi1Db = store.getIndexDb("Global", table.TableName, "test_gsi1");
	const gsi2Db = store.getIndexDb("Global", table.TableName, "test_gsi2");
	const lsi1Db = store.getIndexDb("Local", table.TableName, "test_lsi1");
	const lsi2Db = store.getIndexDb("Local", table.TableName, "test_lsi2");

	await updateIndexes(store, table, null, fullItem);
	await updateIndexes(store, table, fullItem, fullItem);

	await expect(toArray(gsi1Db.iterator())).resolves.toEqual([
		[
			"57e952/677369315f705f6b65795f76616c/677369315f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				gsi1_p_key: { S: "gsi1_p_key_val" },
				gsi1_s_key: { S: "gsi1_s_key_val" },
				gsi2_p_key: { S: "gsi2_p_key_val" },
				gsi2_s_key: { S: "gsi2_s_key_val" },
				lsi1_s_key: { S: "lsi1_s_key_val" },
				lsi2_s_key: { S: "lsi2_s_key_val" },
				foo: { S: "foo_val" },
				bar: { S: "bar_val" },
				baz: { S: "baz_val" },
			},
		],
	]);
	await expect(toArray(gsi2Db.iterator())).resolves.toEqual([
		[
			"56f148/677369325f705f6b65795f76616c/677369325f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				gsi2_p_key: { S: "gsi2_p_key_val" },
				gsi2_s_key: { S: "gsi2_s_key_val" },
				foo: { S: "foo_val" },
			},
		],
	]);
	await expect(toArray(lsi1Db.iterator())).resolves.toEqual([
		[
			"f993f5/6c7369315f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				gsi1_p_key: { S: "gsi1_p_key_val" },
				gsi1_s_key: { S: "gsi1_s_key_val" },
				gsi2_p_key: { S: "gsi2_p_key_val" },
				gsi2_s_key: { S: "gsi2_s_key_val" },
				lsi1_s_key: { S: "lsi1_s_key_val" },
				lsi2_s_key: { S: "lsi2_s_key_val" },
				foo: { S: "foo_val" },
				bar: { S: "bar_val" },
				baz: { S: "baz_val" },
			},
		],
	]);
	await expect(toArray(lsi2Db.iterator())).resolves.toEqual([
		[
			"955cd8/6c7369325f735f6b65795f76616c/412e92",
			{
				p_key: { S: "p_key_val" },
				s_key: { S: "s_key_val" },
				lsi2_s_key: { S: "lsi2_s_key_val" },
				bar: { S: "bar_val" },
			},
		],
	]);
});

// test helper

async function toArray<T>(iterator: AsyncIterable<T>): Promise<T[]> {
	const arr: T[] = [];
	for await (const value of iterator) {
		arr.push(value);
	}
	return arr;
}
