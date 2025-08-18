import { Faker, PkTable, ddb, expectUuid } from "./_test-helper";

describe("put-item (API spec)", () => {
	let tableName: string;

	beforeAll(async () => {
		const table = await PkTable.create();
		tableName = table.tableName;
	});

	test("puts a new item", async () => {
		// GIVEN
		const item1 = {
			pk: Faker.s(),
			key1: Faker.s(),
		};

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
		const pk = Faker.s();
		const itemOld = { pk, key1: Faker.s() };
		const itemNew = { pk, key1: Faker.s() };
		await ddb.putItem({ TableName: tableName, Item: itemOld });

		// WHEN
		const res = await ddb.putItem({
			TableName: tableName,
			Item: itemNew,
			ReturnValues: "ALL_OLD",
		});

		// THEN
		expect(res).toEqual({
			Attributes: itemOld,
			$metadata: expect.any(Object),
		});
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("returns nothing with ReturnValues NONE", async () => {
		// GIVEN
		const pk = Faker.s();
		const itemOld = { pk, key1: Faker.s() };
		const itemNew = { pk, key1: Faker.s() };
		await ddb.putItem({ TableName: tableName, Item: itemOld });

		// WHEN
		const res = await ddb.putItem({
			TableName: tableName,
			Item: itemNew,
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
		const item1 = { pk: Faker.s(), key1: Faker.s() };

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

	// TODO: impl conditional put
	test.skip("conditional put fails with error", async () => {
		// GIVEN
		const pk = Faker.s();
		const itemOld = { pk, key1: Faker.s() };
		const itemNew = { pk, key1: Faker.s() };
		await ddb.putItem({ TableName: tableName, Item: itemOld });

		// WHEN
		const promise = ddb.putItem({
			TableName: tableName,
			Item: itemNew,
			ConditionExpression: "attribute_not_exists(pk)",
		});

		// THEN
		await expect(promise).rejects.toThrow("The conditional request failed");
	});

	test("returns error if key is missing", async () => {
		// WHEN
		const promise = ddb.putItem({ TableName: tableName, Item: {} });

		// THEN
		await expect(promise).rejects.toThrow(
			"One of the required keys was not given a value",
		);
	});

	test("returns error if table does not exist", async () => {
		// GIVEN
		const item1 = { pk: Faker.s(), key1: Faker.s() };

		// WHEN
		const promise = ddb.putItem({ TableName: "not-exist", Item: item1 });

		// THEN
		await expect(promise).rejects.toThrow(
			"Cannot do operations on a non-existent table",
		);
	});

	describe("custom validation tests", () => {
		test("returns error for invalid ReturnValues", async () => {
			// GIVEN
			const item1 = { pk: Faker.s(), key1: Faker.s() };

			// WHEN
			const promise = ddb.putItem({
				TableName: tableName,
				Item: item1,
				ReturnValues: "ALL_NEW",
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Return values set to invalid value",
			);
		});

		test("returns error for invalid ReturnValues UPDATED_OLD", async () => {
			// GIVEN
			const item1 = { pk: Faker.s(), key1: Faker.s() };

			// WHEN
			const promise = ddb.putItem({
				TableName: tableName,
				Item: item1,
				ReturnValues: "UPDATED_OLD",
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Return values set to invalid value",
			);
		});

		test("returns error for invalid ReturnValues UPDATED_NEW", async () => {
			// GIVEN
			const item1 = { pk: Faker.s(), key1: Faker.s() };

			// WHEN
			const promise = ddb.putItem({
				TableName: tableName,
				Item: item1,
				ReturnValues: "UPDATED_NEW",
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Return values set to invalid value",
			);
		});

		test.skip("returns error for item size exceeding limit", async () => {
			// GIVEN
			const largeString = "a".repeat(400001); // Exceed 400KB limit
			const largeItem = {
				pk: Faker.s(),
				data: { S: largeString },
			};

			// WHEN
			const promise = ddb.putItem({
				TableName: tableName,
				Item: largeItem,
			});

			// THEN
			// Note: Dylite's item size validation may not be working properly
			await expect(promise).rejects.toThrow(
				"Item size has exceeded the maximum allowed size",
			);
		});

		test("returns error for invalid expression parameters", async () => {
			// GIVEN
			const item1 = { pk: Faker.s(), key1: Faker.s() };

			// WHEN - ConditionExpression with Expected (conflicting parameters)
			const promise = ddb.putItem({
				TableName: tableName,
				Item: item1,
				ConditionExpression: "attribute_not_exists(pk)",
				Expected: {
					pk: { Exists: false },
				},
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Can not use both expression and non-expression parameters in the same request: Non-expression parameters: {Expected} Expression parameters: {ConditionExpression}",
			);
		});
	});
});
