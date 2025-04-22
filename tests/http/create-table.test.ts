import { randomUUID } from "node:crypto";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

const expectUuid = expect.stringMatching(
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);

const ddb = new DynamoDB({
	endpoint: "http://localhost:8000",
	region: "local-env",
	credentials: {
		accessKeyId: "fakeMyKeyId",
		secretAccessKey: "fakeSecretAccessKey",
	},
});

test("happy path", async () => {
	const tableName = `test-table-${randomUUID()}`;
	const res = await ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
	});
	expect(res).toEqual({
		TableDescription: {
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
	});
});
