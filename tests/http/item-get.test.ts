import { randomUUID } from "node:crypto";
import { ddb } from "./_test-helper";

describe("get-item", () => {
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

	test("retrieves an inserted item", async () => {
		const pk = { S: "item1" };
		const item = { pk, data: { S: "value" } };
		await ddb.putItem({ TableName: tableName, Item: item });
		const res = await ddb.getItem({ TableName: tableName, Key: { pk } });
		expect(res.Item).toEqual(item);
		expect(res.$metadata.httpStatusCode).toBe(200);
	});

	test("response has $metadata", async () => {
		const pk = { S: "item1" };
		const item = { pk, data: { S: "value" } };
		await ddb.putItem({ TableName: tableName, Item: item });
		const res = await ddb.getItem({ TableName: tableName, Key: { pk } });
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
