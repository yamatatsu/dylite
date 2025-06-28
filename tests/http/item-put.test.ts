import { randomUUID } from "node:crypto";
import { ddb } from "./_test-helper";

describe("put-item", () => {
	let tableName: string;

	beforeAll(async () => {
		tableName = `test-table-${randomUUID()}`;
		await ddb.createTable({
			TableName: tableName,
			AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
			KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
			BillingMode: "PAY_PER_REQUEST",
		});
	});

	test("successfully puts an item", async () => {
		const pk = `item1-${randomUUID()}`;
		const item = { pk: { S: pk }, data: { S: "value" } };
		const res = await ddb.putItem({
			TableName: tableName,
			Item: item,
		});
		expect(res).toEqual({
			$metadata: expect.any(Object),
		});
	});

	test("response has Attributes", async () => {
		const pk = `item1-${randomUUID()}`;
		const item_old = { pk: { S: pk }, data: { S: "value-old" } };
		const item_new = { pk: { S: pk }, data: { S: "value-new" } };
		await ddb.putItem({
			TableName: tableName,
			Item: item_old,
		});
		const res = await ddb.putItem({
			TableName: tableName,
			Item: item_new,
			ReturnValues: "ALL_OLD",
		});
		expect(res).toEqual({
			Attributes: item_old,
			$metadata: expect.any(Object),
		});
	});

	test("response has $metadata", async () => {
		const pk = `item1-${randomUUID()}`;
		const item = { pk: { S: pk }, data: { S: "value" } };
		const res = await ddb.putItem({
			TableName: tableName,
			Item: item,
		});
		expect(res.$metadata).toMatchObject({
			attempts: 1,
			cfId: undefined,
			extendedRequestId: undefined,
			httpStatusCode: 200,
			requestId: expect.any(String),
			totalRetryDelay: 0,
		});
	});
});
