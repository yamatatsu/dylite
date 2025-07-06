import { PkTable, ddb, expectUuid } from "./_test-helper";

describe("delete-item (API spec)", () => {
	let tableName: string;
	const item = PkTable.getItem1();

	beforeAll(async () => {
		const table = await PkTable.create();
		tableName = table.tableName;
	});

	beforeEach(async () => {
		// Clean up any existing item before each test
		await ddb
			.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
			})
			.catch(() => {});
	});

	test("deletes an item", async () => {
		// GIVEN
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const delRes = await ddb.deleteItem({
			TableName: tableName,
			Key: { pk: item.pk },
		});

		// THEN
		expect(delRes).toEqual({
			$metadata: expect.any(Object),
		});
		expect(delRes.$metadata.httpStatusCode).toBe(200);

		const getRes = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
		});
		expect(getRes.Item).toBeUndefined();
	});

	// TODO: remove `skip` keyword when implementing ConsumedCapacity
	test.skip("returns success when item does not exist", async () => {
		// WHEN
		const delRes = await ddb.deleteItem({
			TableName: tableName,
			Key: { pk: { S: "non-existent" } },
		});

		// THEN
		expect(delRes).toEqual({
			// TODO: impl ConsumedCapacity
			ConsumedCapacity: expect.anything(),
			$metadata: expect.any(Object),
		});
		expect(delRes.$metadata.httpStatusCode).toBe(200);
	});

	test("delete returns old item attributes with ReturnValues: ALL_OLD", async () => {
		// GIVEN
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const delRes = await ddb.deleteItem({
			TableName: tableName,
			Key: { pk: item.pk },
			ReturnValues: "ALL_OLD",
		});

		// THEN
		expect(delRes).toEqual({
			Attributes: item,
			$metadata: expect.any(Object),
		});
		expect(delRes.$metadata.httpStatusCode).toBe(200);

		const getRes = await ddb.getItem({
			TableName: tableName,
			Key: { pk: item.pk },
		});
		expect(getRes.Item).toBeUndefined();
	});

	test("returns nothing with ReturnValues NONE", async () => {
		// GIVEN
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const delRes = await ddb.deleteItem({
			TableName: tableName,
			Key: { pk: item.pk },
			ReturnValues: "NONE",
		});

		// THEN
		expect(delRes).toEqual({
			$metadata: expect.any(Object),
		});
		expect(delRes.$metadata.httpStatusCode).toBe(200);
	});

	test("returns $metadata", async () => {
		// GIVEN
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const res = await ddb.deleteItem({
			TableName: tableName,
			Key: { pk: item.pk },
		});

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

	test("returns error if key is missing", async () => {
		// WHEN
		const promise = ddb.deleteItem({ TableName: tableName, Key: {} });

		// THEN
		await expect(promise).rejects.toThrow(
			"The number of conditions on the keys is invalid",
		);
	});

	test("returns error if table does not exist", async () => {
		// WHEN
		const promise = ddb.deleteItem({
			TableName: "not-exist",
			Key: { pk: item.pk },
		});

		// THEN
		await expect(promise).rejects.toThrow(
			"Cannot do operations on a non-existent table",
		);
	});

	// TODO: impl conditional delete
	test.skip("conditional delete fails with error", async () => {
		// GIVEN
		await ddb.putItem({ TableName: tableName, Item: item });

		// WHEN
		const promise = ddb.deleteItem({
			TableName: tableName,
			Key: { pk: item.pk },
			ConditionExpression: "attribute_not_exists(pk)",
		});

		// THEN
		await expect(promise).rejects.toThrow("The conditional request failed");
	});

	describe("custom validation tests", () => {
		test("returns error for invalid ReturnValues", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ReturnValues: "ALL_NEW",
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Return values set to invalid value",
			);
		});

		test("returns error for invalid ReturnValues UPDATED_OLD", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ReturnValues: "UPDATED_OLD",
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Return values set to invalid value",
			);
		});

		test("returns error for invalid ReturnValues UPDATED_NEW", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ReturnValues: "UPDATED_NEW",
			});

			// THEN
			await expect(promise).rejects.toThrow(
				"Return values set to invalid value",
			);
		});

		test("accepts valid ReturnValues ALL_OLD", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const res = await ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ReturnValues: "ALL_OLD",
			});

			// THEN
			expect(res).toEqual({
				Attributes: item,
				$metadata: expect.any(Object),
			});
		});

		test("accepts valid ReturnValues NONE", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const res = await ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ReturnValues: "NONE",
			});

			// THEN
			expect(res).toEqual({
				$metadata: expect.any(Object),
			});
		});

		test("returns error for invalid expression parameters", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN - ConditionExpression with Expected (conflicting parameters)
			const promise = ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ConditionExpression: "attribute_exists(pk)",
				Expected: {
					pk: { Exists: true },
				},
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("returns error for ExpressionAttributeNames without expression", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ExpressionAttributeNames: { "#pk": "pk" },
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("returns error for ExpressionAttributeValues without expression", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const promise = ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
				ExpressionAttributeValues: { ":val": { S: "test" } },
			});

			// THEN
			await expect(promise).rejects.toThrow();
		});

		test("deletes item when no ReturnValues specified", async () => {
			// GIVEN
			await ddb.putItem({ TableName: tableName, Item: item });

			// WHEN
			const res = await ddb.deleteItem({
				TableName: tableName,
				Key: { pk: item.pk },
			});

			// THEN
			expect(res).toEqual({
				$metadata: expect.any(Object),
			});

			// Verify item was deleted
			const getRes = await ddb.getItem({
				TableName: tableName,
				Key: { pk: item.pk },
			});
			expect(getRes.Item).toBeUndefined();
		});
	});
});
