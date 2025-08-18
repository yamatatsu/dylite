import { Faker, Table, ddb, expectUuid } from "./_test-helper";

describe.skip("query (API spec)", () => {
	let tableName: string;
	beforeAll(async () => {
		const table = await Table.createPkSkTable();
		tableName = table.tableName;
	});

	describe("basic query operations", () => {
		const pk1 = Faker.s("user1");
		const pk2 = Faker.s("user2");
		const pk1sk1 = Faker.s("profile");
		const pk1sk2 = Faker.s("settings#privacy");
		const pk1sk3 = Faker.s("settings#theme");
		const pk2sk1 = Faker.s("profile");
		const pk2sk2 = Faker.s("settings#privacy");
		const items = [
			{ pk: pk1, sk: pk1sk1 },
			{ pk: pk1, sk: pk1sk2 },
			{ pk: pk1, sk: pk1sk3 },
			{ pk: pk2, sk: pk2sk1 },
			{ pk: pk2, sk: pk2sk2 },
		];

		beforeAll(async () => {
			for (const item of items) {
				await ddb.putItem({ TableName: tableName, Item: item });
			}
		});

		test("queries items by partition key", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": pk1,
				},
			});

			// THEN
			expect(res).toEqual({
				Items: expect.any(Array),
				Count: 3,
				ScannedCount: 3,
				$metadata: expect.any(Object),
			});
			expect(res.Items).toHaveLength(3);
			expect(res.$metadata.httpStatusCode).toBe(200);
		});

		test("queries items by partition key and sort key condition", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
				ExpressionAttributeValues: {
					":pk": pk1,
					":sk": { S: "settings" },
				},
			});

			// THEN
			expect(res).toEqual({
				Items: expect.any(Array),
				Count: 2,
				ScannedCount: 2,
				$metadata: expect.any(Object),
			});
			expect(res.Items).toHaveLength(2);
		});

		test("queries items with exact sort key match", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk AND sk = :sk",
				ExpressionAttributeValues: {
					":pk": pk1,
					":sk": pk1sk1,
				},
			});

			// THEN
			expect(res).toEqual({
				Items: [
					expect.objectContaining({
						pk: pk1,
						sk: pk1sk1,
					}),
				],
				Count: 1,
				ScannedCount: 1,
				$metadata: expect.any(Object),
			});
		});

		test("returns empty result when no items match", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": { S: "nonexistent" },
				},
			});

			// THEN
			expect(res).toEqual({
				Items: [],
				Count: 0,
				ScannedCount: 0,
				$metadata: expect.any(Object),
			});
		});

		test("queries with limit parameter", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": pk1,
				},
				Limit: 2,
			});

			// THEN
			expect(res).toEqual({
				Items: expect.any(Array),
				Count: 2,
				ScannedCount: 2,
				LastEvaluatedKey: expect.any(Object),
				$metadata: expect.any(Object),
			});
			expect(res.Items).toHaveLength(2);
		});

		test("queries in descending order", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": pk1,
				},
				ScanIndexForward: false,
			});

			// THEN
			expect(res).toEqual({
				Items: [
					expect.objectContaining({ pk: pk1, sk: pk1sk3 }),
					expect.objectContaining({ pk: pk1, sk: pk1sk2 }),
					expect.objectContaining({ pk: pk1, sk: pk1sk1 }),
				],
				Count: 3,
				ScannedCount: 3,
				$metadata: expect.any(Object),
			});
		});

		test("returns $metadata", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": pk1,
				},
			});

			// THEN
			expect(res).toEqual({
				Items: expect.any(Array),
				Count: expect.any(Number),
				ScannedCount: expect.any(Number),
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
	});

	describe("sort key condition operators", () => {
		const pk1 = Faker.s("item#1");

		const pk1sk1 = Faker.s();
		const pk1sk2 = Faker.s();
		const pk1sk3 = Faker.s();
		const pk1sk4 = Faker.s();
		const pk1sk5 = Faker.s();

		const items = [
			{ pk: pk1, sk: pk1sk1 },
			{ pk: pk1, sk: pk1sk2 },
			{ pk: pk1, sk: pk1sk3 },
			{ pk: pk1, sk: pk1sk4 },
			{ pk: pk1, sk: pk1sk5 },
		];

		beforeAll(async () => {
			for (const item of items) {
				await ddb.putItem({ TableName: tableName, Item: item });
			}
		});

		test("queries with greater than condition", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk AND sk > :sk",
				ExpressionAttributeValues: {
					":pk": pk1,
					":sk": pk1sk2,
				},
			});

			// THEN
			expect(res.Items).toHaveLength(3);
			expect(res.Count).toBe(3);
		});

		test("queries with greater than or equal condition", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk AND sk >= :sk",
				ExpressionAttributeValues: {
					":pk": pk1,
					":sk": pk1sk2,
				},
			});

			// THEN
			expect(res.Items).toHaveLength(4);
			expect(res.Count).toBe(4);
		});

		test("queries with less than condition", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk AND sk < :sk",
				ExpressionAttributeValues: {
					":pk": pk1,
					":sk": pk1sk4,
				},
			});

			// THEN
			expect(res.Items).toHaveLength(3);
			expect(res.Count).toBe(3);
		});

		test("queries with less than or equal condition", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk AND sk <= :sk",
				ExpressionAttributeValues: {
					":pk": pk1,
					":sk": pk1sk4,
				},
			});

			// THEN
			expect(res.Items).toHaveLength(4);
			expect(res.Count).toBe(4);
		});

		test("queries with between condition", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk AND sk BETWEEN :start AND :end",
				ExpressionAttributeValues: {
					":pk": pk1,
					":start": pk1sk2,
					":end": pk1sk4,
				},
			});

			// THEN
			expect(res.Items).toHaveLength(3);
			expect(res.Count).toBe(3);
		});
	});

	describe.skip("GSI queries", () => {
		const userId1 = Faker.s();
		const userId2 = Faker.s();
		const userId3 = Faker.s();

		const profile = Faker.s("profile");
		const active = Faker.s("active");
		const inactive = Faker.s("inactive");

		beforeAll(async () => {
			// Insert test data
			const items = [
				{
					pk: userId1,
					sk: profile,
					gsi1pk: active,
					gsi1sk: userId1,
					status: active,
				},
				{
					pk: userId2,
					sk: profile,
					gsi1pk: active,
					gsi1sk: userId2,
					status: active,
				},
				{
					pk: userId3,
					sk: profile,
					gsi1pk: inactive,
					gsi1sk: userId3,
					status: inactive,
				},
			];

			for (const item of items) {
				await ddb.putItem({ TableName: tableName, Item: item });
			}
		});

		test("queries GSI by index", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				IndexName: "GSI1",
				KeyConditionExpression: "gsi1pk = :gsi1pk",
				ExpressionAttributeValues: {
					":gsi1pk": active,
				},
			});

			// THEN
			expect(res.Items).toHaveLength(2);
			expect(res.Count).toBe(2);
		});
	});

	describe.skip("filter expressions", () => {
		const pk1 = Faker.s();
		const pk1sk1 = Faker.s();
		const pk1sk2 = Faker.s();
		const pk1sk3 = Faker.s();

		beforeAll(async () => {
			// Insert test data
			const items = [
				{
					pk: pk1,
					sk: pk1sk1,
					price: Faker.n(100),
					category: { S: "electronics" },
				},
				{
					pk: pk1,
					sk: pk1sk2,
					price: Faker.n(200),
					category: { S: "electronics" },
				},
				{
					pk: pk1,
					sk: pk1sk3,
					price: Faker.n(50),
					category: { S: "books" },
				},
			];

			for (const item of items) {
				await ddb.putItem({ TableName: tableName, Item: item });
			}
		});

		test("queries with filter expression", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				FilterExpression: "price > :price",
				ExpressionAttributeValues: {
					":pk": pk1,
					":price": Faker.n(75),
				},
			});

			// THEN
			expect(res.Items).toHaveLength(2);
			expect(res.Count).toBe(2);
			expect(res.ScannedCount).toBe(3); // All items were scanned, but only 2 matched filter
		});
	});

	describe.skip("projection expressions", () => {
		const pk = Faker.s();
		const sk = Faker.s();
		const name = Faker.s("name");

		beforeAll(async () => {
			// Insert test data
			const item = { pk, sk, name };

			await ddb.putItem({ TableName: tableName, Item: item });
		});

		test("queries with projection expression", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ProjectionExpression: "pk, sk, #n",
				ExpressionAttributeNames: {
					"#n": "name",
				},
				ExpressionAttributeValues: {
					":pk": pk,
				},
			});

			// THEN
			expect(res.Items).toHaveLength(1);
			expect(res.Items?.[0]).toEqual({
				pk,
				sk,
				name,
			});
		});
	});

	describe("error cases", () => {
		test("returns error if table does not exist", async () => {
			// WHEN
			const promise = ddb.query({
				TableName: "not-exist",
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": { S: "test" },
				},
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Cannot do operations on a non-existent table",
			);
		});

		test("returns error if KeyConditionExpression is missing", async () => {
			// WHEN
			const promise = ddb.query({
				TableName: tableName,
				ExpressionAttributeValues: {
					":pk": { S: "test" },
				},
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"ExpressionAttributeValues can only be specified when using expressions: FilterExpression and KeyConditionExpression are null",
			);
		});

		test("returns error if partition key is not provided", async () => {
			// WHEN
			const promise = ddb.query({
				TableName: tableName,
				KeyConditionExpression: "sk = :sk",
				ExpressionAttributeValues: {
					":sk": { S: "test" },
				},
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Query condition missed key schema element",
			);
		});

		test("returns error for invalid attribute value reference", async () => {
			// WHEN
			const promise = ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":wrong": { S: "test" },
				},
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Invalid KeyConditionExpression: An expression attribute value used in expression is not defined; attribute value: :pk",
			);
		});

		test("returns error for invalid limit value", async () => {
			// WHEN
			const promise = ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": { S: "test" },
				},
				Limit: 0,
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Limit must be greater than or equal to 1",
			);
		});
	});

	describe("custom validation tests", () => {
		test("accepts valid KeyConditionExpression with partition key only", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": { S: "test" },
				},
			});

			// THEN
			expect(res).toEqual({
				Items: [],
				Count: 0,
				ScannedCount: 0,
				$metadata: expect.any(Object),
			});
		});

		test("accepts valid Limit parameter", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": { S: "test" },
				},
				Limit: 10,
			});

			// THEN
			expect(res).toEqual({
				Items: [],
				Count: 0,
				ScannedCount: 0,
				$metadata: expect.any(Object),
			});
		});

		test("accepts ScanIndexForward parameter", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": { S: "test" },
				},
				ScanIndexForward: true,
			});

			// THEN
			expect(res).toEqual({
				Items: [],
				Count: 0,
				ScannedCount: 0,
				$metadata: expect.any(Object),
			});
		});

		test("accepts ConsistentRead parameter", async () => {
			// WHEN
			const res = await ddb.query({
				TableName: tableName,
				KeyConditionExpression: "pk = :pk",
				ExpressionAttributeValues: {
					":pk": { S: "test" },
				},
				ConsistentRead: false,
			});

			// THEN
			expect(res).toEqual({
				Items: [],
				Count: 0,
				ScannedCount: 0,
				$metadata: expect.any(Object),
			});
		});
	});
});
