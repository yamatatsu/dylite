import { traverseTableKey } from "./traverseKey";
import type { Table } from "./types";

test("only hash key", () => {
	const table = {
		TableName: "test-table",
		KeySchema: [{ AttributeName: "hash-attr", KeyType: "HASH" }],
		AttributeDefinitions: [{ AttributeName: "hash-attr", AttributeType: "S" }],
	} satisfies Table;
	const visitKey = jest.fn();

	traverseTableKey(table, visitKey);

	expect(visitKey).toHaveBeenCalledTimes(1);
	expect(visitKey).toHaveBeenCalledWith("hash-attr", "S", true);
});

test("both hash and range keys", () => {
	const table = {
		TableName: "test-table",
		KeySchema: [
			{ AttributeName: "hash-attr", KeyType: "HASH" },
			{ AttributeName: "range-attr", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "hash-attr", AttributeType: "S" },
			{ AttributeName: "range-attr", AttributeType: "N" },
		],
	} satisfies Table;
	const visitKey = jest.fn();

	traverseTableKey(table, visitKey);

	expect(visitKey).toHaveBeenCalledTimes(2);
	expect(visitKey).toHaveBeenNthCalledWith(1, "hash-attr", "S", true);
	expect(visitKey).toHaveBeenNthCalledWith(2, "range-attr", "N", false);
});

test("error in visitKey", () => {
	const table = {
		TableName: "test-table",
		KeySchema: [
			{ AttributeName: "hash-attr", KeyType: "HASH" },
			{ AttributeName: "range-attr", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "hash-attr", AttributeType: "S" },
			{ AttributeName: "range-attr", AttributeType: "N" },
		],
	} satisfies Table;
	const visitKey = jest.fn().mockReturnValue(new Error("test"));

	traverseTableKey(table, visitKey);

	expect(visitKey).toHaveBeenCalledTimes(1);
	expect(visitKey).toHaveBeenNthCalledWith(1, "hash-attr", "S", true);
});
