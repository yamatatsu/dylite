import { PkTable, ddb, expectUuid } from "./_test-helper";

describe("delete-item", () => {
	let tableName: string;
	const item = PkTable.getItem1();

	beforeAll(async () => {
		const table = await PkTable.create();
		tableName = table.tableName;
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
			Key: { pk: item.pk },
		});

		// THEN
		expect(delRes).toEqual({
			// TODO: impl ConsumedCapacity
			ConsumedCapacity: expect.anything(),
			$metadata: expect.any(Object),
		});
		expect(delRes.$metadata.httpStatusCode).toBe(200);
	});

	// TODO: impl
	test.skip("delete returns old item attributes with ReturnValues: ALL_OLD", async () => {
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
});
