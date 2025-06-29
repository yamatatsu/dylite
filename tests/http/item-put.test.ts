import { PkTable, ddb, expectUuid } from "./_test-helper";

describe("put-item (API spec)", () => {
	let tableName: string;

	beforeAll(async () => {
		const table = await PkTable.create();
		tableName = table.tableName;
	});

	test("puts a new item", async () => {
		// GIVEN
		const item1 = PkTable.getItem1();

		// WHEN
		const res = await ddb.putItem({ TableName: tableName, Item: item1 });

		// THEN
		expect(res).toEqual({
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("overwrites and returns ALL_OLD", async () => {
		// GIVEN
		const item1 = PkTable.getItem1();
		const item2 = { ...item1, key1: { S: "bar" } };
		await ddb.putItem({ TableName: tableName, Item: item1 });

		// WHEN
		const res = await ddb.putItem({
			TableName: tableName,
			Item: item2,
			ReturnValues: "ALL_OLD",
		});

		// THEN
		expect(res).toEqual({
			Attributes: item1,
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("returns nothing with ReturnValues NONE", async () => {
		// GIVEN
		const item1 = PkTable.getItem1();
		const item2 = { ...item1, key1: { S: "bar" } };
		await ddb.putItem({ TableName: tableName, Item: item1 });

		// WHEN
		const res = await ddb.putItem({
			TableName: tableName,
			Item: item2,
			ReturnValues: "NONE",
		});

		// THEN
		expect(res).toEqual({
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("returns $metadata", async () => {
		// GIVEN
		const item1 = PkTable.getItem1();

		// WHEN
		const res = await ddb.putItem({ TableName: tableName, Item: item1 });

		// THEN
		expect(res).toEqual({
			$metadata: {
				httpStatusCode: 200,
				requestId: expectUuid,
				attempts: 1,
				totalRetryDelay: 0,
				cfId: undefined,
				extendedRequestId: undefined,
			},
		});
	});

	test("conditional put fails with error", async () => {
		// GIVEN
		const item1 = PkTable.getItem1();
		const item2 = { ...item1, key1: { S: "bar" } };
		await ddb.putItem({ TableName: tableName, Item: item1 });

		// WHEN
		const promise = ddb.putItem({
			TableName: tableName,
			Item: item2,
			ConditionExpression: "attribute_not_exists(pk)",
		});

		// THEN
		await expect(promise).rejects.toThrow("The conditional request failed");
	});

	test("returns error if key is missing", async () => {
		// GIVEN
		const item1 = PkTable.getItem1();

		// WHEN
		const promise = ddb.putItem({ TableName: tableName, Item: {} });

		// THEN
		await expect(promise).rejects.toThrow(
			"One of the required keys was not given a value",
		);
	});

	test("returns error if table does not exist", async () => {
		// GIVEN
		const item1 = PkTable.getItem1();

		// WHEN
		const promise = ddb.putItem({ TableName: "not-exist", Item: item1 });

		// THEN
		await expect(promise).rejects.toThrow(
			"Cannot do operations on a non-existent table",
		);
	});
});
