import { randomUUID } from "node:crypto";
import { ddb } from "./ddb";
import { toUint8Array } from "./utils";

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
	key_S: { S: "foo" },
	key_N: { N: "123" },
	key_B: { B: toUint8Array("bar") },
	key_SS: { SS: ["a", "b"] },
	key_NS: { NS: ["1", "2"] },
	key_BS: { BS: [toUint8Array("x"), toUint8Array("y")] },
	key_M: { M: { MAP_KEY_1: { S: "foo" }, MAP_KEY_2: { N: "123" } } },
	key_L: { L: [{ S: "foo" }, { N: "123" }] },
	key_NULL: { NULL: true },
	key_BOOL: { BOOL: true },
});
