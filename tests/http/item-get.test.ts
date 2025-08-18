import { Faker, PkTable, ddb, expectUuid } from "./_test-helper";

describe("get-item (API spec)", () => {
	let tableName: string;

	beforeAll(async () => {
		const table = await PkTable.create();
		tableName = table.tableName;
	});

	test("retrieves an inserted item by key", async () => {
		// GIVEN
		const item = {
			pk: Faker.s(),
		};
		await ddb.putItem({ TableName: tableName, Item: item });

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
		// GIVEN
		const item = {
			pk: Faker.s(),
			key_S: Faker.s(),
		};
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const res = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
			ProjectionExpression: "pk,key_S",
		});

		// THEN
		expect(res).toEqual({
			Item: { pk: item.pk, key_S: item.key_S },
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	// TODO: impl ProjectionExpression
	test.skip("supports ExpressionAttributeNames in ProjectionExpression", async () => {
		// GIVEN
		const item = {
			pk: Faker.s(),
			key_N: Faker.n(),
		};
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const res = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
			ProjectionExpression: "pk,#k1",
			ExpressionAttributeNames: { "#k1": "key_N" },
		});

		// THEN
		expect(res).toEqual({
			Item: { pk: item.pk, key_N: item.key_N },
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("returns $metadata", async () => {
		// GIVEN
		const item = {
			pk: Faker.s(),
			key_S: Faker.s(),
		};
		await ddb.putItem({ TableName: tableName, Item: item });

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
		// GIVEN
		const item = {
			pk: Faker.s(),
			key_S: Faker.s(),
		};
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const promise = ddb.getItem({
			TableName: "not-exist",
			Key: { pk: item.pk },
		});

		// THEN
		await expect(promise).rejects.toThrow();
	});

	describe("custom validation tests", () => {
		test("returns error for duplicate AttributesToGet", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
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
			const promise = ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
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
			const promise = ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
				AttributesToGet: ["pk", "", "key1"], // empty string
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test.skip("returns error for too long AttributesToGet item", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const longAttributeName = "a".repeat(256); // exceed 255 char limit
			const promise = ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
				AttributesToGet: ["pk", longAttributeName],
			});

			// THEN
			// Note: DynamoDB Local doesn't enforce the 255 character limit
			await expect(promise).rejects.toThrow();
		});

		test("returns error for invalid ExpressionAttributeNames format", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ProjectionExpression: "#k1",
				ExpressionAttributeNames: { k1: "key1" }, // missing # prefix
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("returns error for empty ExpressionAttributeNames", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ProjectionExpression: "#k1",
				ExpressionAttributeNames: {}, // empty object
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("accepts valid AttributesToGet", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const res = await ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
				AttributesToGet: ["pk", "key1"],
			});

			// THEN
			expect(res).toEqual({
				Item: expect.any(Object),
				$metadata: expect.any(Object),
			});
		});

		test.skip("accepts valid ExpressionAttributeNames", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const res = await ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ProjectionExpression: "#pk",
				ExpressionAttributeNames: { "#pk": "pk" },
			});

			// THEN
			// Note: ProjectionExpression is not implemented in Dylite yet
			expect(res).toEqual({
				Item: expect.any(Object),
				$metadata: expect.any(Object),
			});
		});

		test("accepts ConsistentRead parameter", async () => {
			// GIVEN
			const item = {
				pk: Faker.s(),
				key1: Faker.s(),
			};
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const res = await ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ConsistentRead: true,
			});

			// THEN
			expect(res).toEqual({
				Item: item,
				$metadata: expect.any(Object),
			});
		});
	});
});
