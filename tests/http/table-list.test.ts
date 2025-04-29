import { randomUUID } from "node:crypto";
import { ddb, expectUuid } from "./_test-helper";

test("happy path", async () => {
	const uuid = randomUUID();
	const tableName01 = `test-table-01-${uuid}`;
	const tableName02 = `test-table-02-${uuid}`;
	await ddb.createTable({
		TableName: tableName01,
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
	});
	await ddb.createTable({
		TableName: tableName02,
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	const res = await ddb.listTables();
	expect(res).toEqual({
		TableNames: expect.arrayContaining([tableName01, tableName02]),
		$metadata: {
			attempts: 1,
			cfId: undefined,
			extendedRequestId: undefined,
			httpStatusCode: 200,
			requestId: expectUuid,
			totalRetryDelay: 0,
		},
	});
});
