import { randomUUID } from "node:crypto";
import type { DeleteTableOutput } from "@aws-sdk/client-dynamodb";
import deepMerge from "lodash.merge";
import { ddb, expectUuid } from "./_test-helper";

test("happy path", async () => {
	const tableName = `test-table-${randomUUID()}`;
	await ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
	});
	const res = await ddb.describeTable({
		TableName: tableName,
	});
	expect(res).toEqual(resTemplate(tableName));
});

////////////////////////////////////////////////////////////
// test helpers

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const resTemplate = (
	tableName: string,
	overrides?: DeepPartial<DeleteTableOutput>,
) =>
	deepMerge(
		{
			Table: {
				AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
				BillingModeSummary: {
					BillingMode: "PAY_PER_REQUEST",
					LastUpdateToPayPerRequestDateTime: expect.any(Date),
				},
				CreationDateTime: expect.any(Date),
				DeletionProtectionEnabled: false,
				ItemCount: 0,
				KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
				ProvisionedThroughput: {
					LastDecreaseDateTime: new Date(0),
					LastIncreaseDateTime: new Date(0),
					NumberOfDecreasesToday: 0,
					ReadCapacityUnits: 0,
					WriteCapacityUnits: 0,
				},
				TableArn: `arn:aws:dynamodb:ddblocal:000000000000:table/${tableName}`,
				TableName: tableName,
				TableSizeBytes: 0,
				TableStatus: "ACTIVE",
			},
			$metadata: {
				attempts: 1,
				cfId: undefined,
				extendedRequestId: undefined,
				httpStatusCode: 200,
				requestId: expectUuid,
				totalRetryDelay: 0,
			},
		},
		overrides,
	);
