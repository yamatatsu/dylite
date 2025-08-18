import { randomUUID } from "node:crypto";
import type { CreateTableOutput } from "@aws-sdk/client-dynamodb";
import deepMerge from "lodash.merge";
import { ddb, expectUuid } from "./_test-helper";

test("create table with only PK", async () => {
	const tableName = `test-table-${randomUUID()}`;
	const res = await ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
	});
	expect(res).toEqual(resTemplate(tableName));
});

test("create table with PK and SK", async () => {
	const tableName = `test-table-${randomUUID()}`;
	const res = await ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "N" },
			{ AttributeName: "sk", AttributeType: "B" },
		],
		KeySchema: [
			{ AttributeName: "pk", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		BillingMode: "PAY_PER_REQUEST",
	});
	expect(res).toEqual(
		resTemplate(tableName, {
			TableDescription: {
				AttributeDefinitions: [
					{ AttributeName: "pk", AttributeType: "N" },
					{ AttributeName: "sk", AttributeType: "B" },
				],
				KeySchema: [
					{ AttributeName: "pk", KeyType: "HASH" },
					{ AttributeName: "sk", KeyType: "RANGE" },
				],
			},
		}),
	);
});

test("create table with duplicate attribute names", async () => {
	const tableName = `test-table-${randomUUID()}`;
	const promise = ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "N" },
			{ AttributeName: "pk", AttributeType: "N" }, // same name as previous
		],
		KeySchema: [
			{ AttributeName: "pk", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		BillingMode: "PAY_PER_REQUEST",
	});
	await expect(promise).rejects.toThrow(
		"Cannot have two attributes with the same name",
	);
});

test.each`
	KeySchema                                                                                 | errorMessage
	${[{ AttributeName: "sk", KeyType: "RANGE" }, { AttributeName: "pk", KeyType: "HASH" }]}  | ${"Invalid key order. Hash Key must be specified first in key schema, Range Key must be specifed second"}
	${[{ AttributeName: "pk", KeyType: "HASH" }, { AttributeName: "sk", KeyType: "HASH" }]}   | ${"Too many hash keys specified.  All Dynamo DB tables must have exactly one hash key"}
	${[{ AttributeName: "pk", KeyType: "RANGE" }, { AttributeName: "sk", KeyType: "RANGE" }]} | ${"No Hash Key specified in schema.  All Dynamo DB tables must have exactly one hash key"}
`("$errorMessage", async ({ KeySchema, errorMessage }) => {
	const tableName = `test-table-${randomUUID()}`;
	const promise = ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "N" },
			{ AttributeName: "sk", AttributeType: "B" },
		],
		KeySchema: KeySchema,
		BillingMode: "PAY_PER_REQUEST",
	});
	await expect(promise).rejects.toThrow(errorMessage);
});

////////////////////////////////////////////////////////////
// test helpers

type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const resTemplate = (
	tableName: string,
	overrides?: DeepPartial<CreateTableOutput>,
) =>
	deepMerge(
		{
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
		},
		overrides,
	);
