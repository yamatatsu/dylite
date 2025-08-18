import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import { Faker, Table, ddb, expectUuid } from "./_test-helper";

describe("scan (API spec)", () => {
	let tableName: string;
	let items: Record<string, AttributeValue>[];

	beforeAll(async () => {
		const table = await Table.createPkTable();
		tableName = table.tableName;

		items = [
			{ pk: Faker.s(), data: Faker.s() },
			{ pk: Faker.s(), data: Faker.s() },
			{ pk: Faker.s(), data: Faker.s() },
		];
		for (const item of items) {
			await ddb.putItem({ TableName: tableName, Item: item });
		}
	});

	test("scans all items in table", async () => {
		// WHEN
		const res = await ddb.scan({ TableName: tableName });

		// THEN
		expect(res.Items).toHaveLength(3);
		expect(res.Items).toEqual(expect.arrayContaining(items));
		expect(res.Count).toBe(3);
		expect(res.ScannedCount).toBe(3);
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("returns empty result for empty table", async () => {
		// GIVEN
		const emptyTable = await Table.createPkTable();

		// WHEN
		const res = await ddb.scan({ TableName: emptyTable.tableName });

		// THEN
		expect(res.Items).toEqual([]);
		expect(res.Count).toBe(0);
		expect(res.ScannedCount).toBe(0);
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("respects Limit parameter", async () => {
		// WHEN
		const res = await ddb.scan({
			TableName: tableName,
			Limit: 2,
		});

		// THEN
		expect(res.Items).toHaveLength(2);
		expect(res.Count).toBe(2);
		expect(res.ScannedCount).toBe(2);
		expect(res.LastEvaluatedKey).toBeDefined();
	});

	test("supports pagination with ExclusiveStartKey", async () => {
		// WHEN - First page
		const firstPage = await ddb.scan({
			TableName: tableName,
			Limit: 2,
		});

		// WHEN - Second page
		const secondPage = await ddb.scan({
			TableName: tableName,
			ExclusiveStartKey: firstPage.LastEvaluatedKey,
		});

		// THEN
		expect(firstPage.Items).toHaveLength(2);
		expect(secondPage.Items).toHaveLength(1);
		expect(firstPage.LastEvaluatedKey).toBeDefined();
		expect(secondPage.LastEvaluatedKey).toBeUndefined();
	});

	test.skip("returns $metadata", async () => {
		// GIVEN
		const item = { pk: Faker.s(), data: Faker.s() };
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const res = await ddb.scan({ TableName: tableName });

		// THEN
		expect(res.$metadata).toEqual({
			httpStatusCode: 200,
			requestId: expectUuid,
			attempts: 1,
			totalRetryDelay: 0,
			cfId: undefined,
			extendedRequestId: undefined,
		});
	});

	test.skip("returns error if table does not exist", async () => {
		// WHEN
		const promise = ddb.scan({ TableName: "not-exist" });

		// THEN
		await expect(promise).rejects.toThrow();
	});

	// TODO: impl ProjectionExpression
	test.skip("supports ProjectionExpression", async () => {
		// GIVEN
		const item = {
			pk: Faker.s(),
			key_S: Faker.s(),
			key_N: Faker.n(),
		};
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const res = await ddb.scan({
			TableName: tableName,
			ProjectionExpression: "pk,key_S",
		});

		// THEN
		expect(res.Items).toEqual([{ pk: item.pk, key_S: item.key_S }]);
	});

	// TODO: impl FilterExpression
	test.skip("supports FilterExpression", async () => {
		// GIVEN
		const items = [
			{ pk: Faker.s(), status: { S: "active" } },
			{ pk: Faker.s(), status: { S: "inactive" } },
			{ pk: Faker.s(), status: { S: "active" } },
		];
		for (const item of items) {
			await ddb.putItem({ TableName: tableName, Item: item });
		}

		// WHEN
		const res = await ddb.scan({
			TableName: tableName,
			FilterExpression: "#status = :active",
			ExpressionAttributeNames: { "#status": "status" },
			ExpressionAttributeValues: { ":active": { S: "active" } },
		});

		// THEN
		expect(res.Items).toHaveLength(2);
		expect(res.Count).toBe(2);
		expect(res.ScannedCount).toBe(3);
	});

	describe.skip("custom validation tests", () => {
		test("returns error for duplicate AttributesToGet", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.scan({
				TableName: tableName,
				AttributesToGet: ["pk", "key1", "pk"], // duplicate "pk"
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("returns error for AttributesToGet with ProjectionExpression", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.scan({
				TableName: tableName,
				AttributesToGet: ["pk", "key1"],
				ProjectionExpression: "pk,key1",
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("returns error for empty AttributesToGet item", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.scan({
				TableName: tableName,
				AttributesToGet: ["pk", "", "key1"], // empty string
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("accepts valid AttributesToGet", async () => {
			// GIVEN - use dedicated table for this test
			const attrTable = await Table.createPkTable();
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: attrTable.tableName, Item: item });

			// WHEN
			const res = await ddb.scan({
				TableName: attrTable.tableName,
				AttributesToGet: ["pk", "key1"],
			});

			// THEN
			expect(res.Items).toEqual([
				expect.objectContaining({ pk: item.pk, key1: item.key1 }),
			]);
		});

		test("accepts ConsistentRead parameter", async () => {
			// GIVEN - use dedicated table for this test
			const consistentTable = await Table.createPkTable();
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: consistentTable.tableName, Item: item });

			// WHEN
			const res = await ddb.scan({
				TableName: consistentTable.tableName,
				ConsistentRead: true,
			});

			// THEN
			expect(res.Items).toEqual([item]);
			expect(res.$metadata.httpStatusCode).toBe(200);
		});

		test("accepts Select parameter", async () => {
			// GIVEN - use dedicated table for this test
			const selectTable = await Table.createPkTable();
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: selectTable.tableName, Item: item });

			// WHEN
			const res = await ddb.scan({
				TableName: selectTable.tableName,
				Select: "COUNT",
			});

			// THEN
			expect(res.Items).toBeUndefined();
			expect(res.Count).toBe(1);
			expect(res.ScannedCount).toBe(1);
		});

		test("returns error for invalid Limit value", async () => {
			// WHEN
			const promise = ddb.scan({
				TableName: tableName,
				Limit: 0, // invalid: must be >= 1
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("returns error for negative Limit value", async () => {
			// WHEN
			const promise = ddb.scan({
				TableName: tableName,
				Limit: -1, // invalid: negative
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});
	});
});
