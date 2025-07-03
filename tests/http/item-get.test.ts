import { PkTable, ddb, expectUuid } from "./_test-helper";

describe("get-item (API spec)", () => {
	let tableName: string;
	const item = PkTable.getItem1();

	beforeAll(async () => {
		const table = await PkTable.create();
		tableName = table.tableName;
		await ddb.putItem({ TableName: tableName, Item: item });
	});

	test("retrieves an inserted item by key", async () => {
		// WHEN
		const res = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
		});

		// THEN
		expect(res).toEqual({
			Item: item,
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("returns no Item if not found", async () => {
		// WHEN
		const res = await ddb.getItem({
			TableName: tableName,
			Key: { pk: { S: "notfound" } },
		});

		// THEN
		expect(res).toEqual({
			Item: undefined,
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	// TODO: impl ProjectionExpression
	test.skip("retrieves only specified attributes with ProjectionExpression", async () => {
		// WHEN
		const res = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
			ProjectionExpression: "pk,key3",
		});

		// THEN
		expect(res).toEqual({
			Item: { pk: item.pk, key3: item.key3 },
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	// TODO: impl ProjectionExpression
	test.skip("supports ExpressionAttributeNames in ProjectionExpression", async () => {
		// WHEN
		const res = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
			ProjectionExpression: "#k1,pk",
			ExpressionAttributeNames: { "#k1": "key1" },
		});

		// THEN
		expect(res).toEqual({
			Item: { pk: item.pk, key1: item.key1 },
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("returns $metadata", async () => {
		// WHEN
		const res = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
		});

		// THEN
		expect(res).toEqual({
			Item: expect.any(Object),
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

	test("returns error if key is missing", async () => {
		// WHEN
		const promise = ddb.getItem({ TableName: tableName, Key: {} });

		// THEN
		await expect(promise).rejects.toThrow();
	});

	test("returns error if table does not exist", async () => {
		// WHEN
		const promise = ddb.getItem({
			TableName: "not-exist",
			Key: { pk: item.pk },
		});

		// THEN
		await expect(promise).rejects.toThrow();
	});
});
