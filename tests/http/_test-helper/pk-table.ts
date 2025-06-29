import { randomUUID } from "node:crypto";
import { ddb } from "./ddb";

export const create = async () => {
	const tableName = `test-table-nolsi-${randomUUID()}`;
	await ddb.createTable({
		TableName: tableName,
		AttributeDefinitions: [{ AttributeName: "pk", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
		BillingMode: "PAY_PER_REQUEST",
	});

	return { tableName };
};

export const getItem1 = () => ({
	pk: { S: `item1-${randomUUID()}` },
	key1: { S: "foo" },
	key2: { N: "123" },
	key3: { SS: ["a", "b"] },
});
