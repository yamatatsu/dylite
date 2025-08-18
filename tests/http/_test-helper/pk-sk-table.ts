import { randomUUID } from "node:crypto";
import { ddb } from "./ddb";

export const create = async () => {
	const tableName = `test-table-pk-sk-${randomUUID()}`;
	await ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [
			{ AttributeName: "pk", AttributeType: "S" },
			{ AttributeName: "sk", AttributeType: "S" },
			{ AttributeName: "gsi1pk", AttributeType: "S" },
			{ AttributeName: "gsi1sk", AttributeType: "S" },
		],
		KeySchema: [
			{ AttributeName: "pk", KeyType: "HASH" },
			{ AttributeName: "sk", KeyType: "RANGE" },
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: "GSI1",
				KeySchema: [
					{ AttributeName: "gsi1pk", KeyType: "HASH" },
					{ AttributeName: "gsi1sk", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
		BillingMode: "PAY_PER_REQUEST",
	});

	return { tableName };
};
