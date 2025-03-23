import { validationError } from "./errors";
import type { Table } from "./types";
import {
	validateAttributeUpdates,
	validateExpressionUpdates,
	validateItem,
	validateKey,
	validateKeyPaths,
	validateKeyPiece,
} from "./validations";

describe("validateKey", () => {
	const table = {
		TableName: "test",
		KeySchema: [
			{ AttributeName: "p_key", KeyType: "HASH" },
			{ AttributeName: "s_key", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "p_key", AttributeType: "S" },
			{ AttributeName: "s_key", AttributeType: "S" },
		],
	} satisfies Table;

	it.each`
		case                                                                            | dataKey                                       | message
		${"should return an error if the length of the key is not matching the schema"} | ${{ p_key: { S: "foo" } }}                    | ${"The provided key element does not match the schema"}
		${"should return an error if the key is not matching the type"}                 | ${{ p_key: { S: "foo" }, s_key: { N: "1" } }} | ${"The provided key element does not match the schema"}
	`("$case", ({ dataKey, message }) => {
		const error = validateKey(dataKey, table);
		expect(error).toEqual(validationError(message));
	});

	it("should return undefined if the key is valid", () => {
		const dataKey = {
			p_key: { S: "foo" },
			s_key: { S: "bar" },
		};
		const error = validateKey(dataKey, table);
		expect(error).toEqual(undefined);
	});
});

describe("validateItem", () => {
	const table = {
		TableName: "test",
		KeySchema: [
			{ AttributeName: "p_key", KeyType: "HASH" },
			{ AttributeName: "s_key", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "p_key", AttributeType: "S" },
			{ AttributeName: "s_key", AttributeType: "S" },
			{ AttributeName: "gsi1_p_key", AttributeType: "S" },
			{ AttributeName: "gsi1_s_key", AttributeType: "S" },
			{ AttributeName: "lsi1_p_key", AttributeType: "S" },
			{ AttributeName: "lsi1_s_key", AttributeType: "S" },
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: "test_gsi1",
				KeySchema: [
					{ AttributeName: "gsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "gsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
		LocalSecondaryIndexes: [
			{
				IndexName: "test_lsi1",
				KeySchema: [
					{ AttributeName: "lsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "lsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
	} satisfies Table;

	it.each`
		case                                                                | item                                                                    | message
		${"should return an error if the item is missing a key"}            | ${{ p_key_xx: { S: "foo" }, s_key: { S: "bar" } }}                      | ${"One or more parameter values were invalid: Missing the key p_key in the item"}
		${"should return an error if the item is missing a key"}            | ${{ p_key: { S: "foo" }, s_key_xx: { S: "bar" } }}                      | ${"One or more parameter values were invalid: Missing the key s_key in the item"}
		${"should return an error if the key is not matching the type"}     | ${{ p_key: { N: "1" }, s_key: { S: "bar" } }}                           | ${"One or more parameter values were invalid: Type mismatch for key p_key expected: S actual: N"}
		${"should return an error if the key is not matching the type"}     | ${{ p_key: { S: "foo" }, s_key: { N: "1" } }}                           | ${"One or more parameter values were invalid: Type mismatch for key s_key expected: S actual: N"}
		${"should return an error if the key is empty"}                     | ${{ p_key: { S: "" }, s_key: { S: "bar" } }}                            | ${"One or more parameter values are not valid. The AttributeValue for a key attribute cannot contain an empty string value. Key: p_key"}
		${"should return an error if the key is empty"}                     | ${{ p_key: { S: "foo" }, s_key: { S: "" } }}                            | ${"One or more parameter values are not valid. The AttributeValue for a key attribute cannot contain an empty string value. Key: s_key"}
		${"should return an error if the hash key is too long"}             | ${{ p_key: { S: "a".repeat(2049) }, s_key: { S: "bar" } }}              | ${"One or more parameter values were invalid: Size of hashkey has exceeded the maximum size limit of2048 bytes"}
		${"should return an error if the range key is too long"}            | ${{ p_key: { S: "foo" }, s_key: { S: "a".repeat(1025) } }}              | ${"One or more parameter values were invalid: Aggregated size of all range keys has exceeded the size limit of 1024 bytes"}
		${"should return an error if the gsi key is not matching the type"} | ${{ p_key: { S: "foo" }, s_key: { S: "bar" }, gsi1_p_key: { N: "1" } }} | ${"One or more parameter values were invalid: Type mismatch for Index Key gsi1_p_key Expected: S Actual: N IndexName: test_gsi1"}
		${"should return an error if the gsi key is not matching the type"} | ${{ p_key: { S: "foo" }, s_key: { S: "bar" }, gsi1_s_key: { N: "1" } }} | ${"One or more parameter values were invalid: Type mismatch for Index Key gsi1_s_key Expected: S Actual: N IndexName: test_gsi1"}
		${"should return an error if the lsi key is not matching the type"} | ${{ p_key: { S: "foo" }, s_key: { S: "bar" }, lsi1_p_key: { N: "1" } }} | ${"One or more parameter values were invalid: Type mismatch for Index Key lsi1_p_key Expected: S Actual: N IndexName: test_lsi1"}
		${"should return an error if the lsi key is not matching the type"} | ${{ p_key: { S: "foo" }, s_key: { S: "bar" }, lsi1_s_key: { N: "1" } }} | ${"One or more parameter values were invalid: Type mismatch for Index Key lsi1_s_key Expected: S Actual: N IndexName: test_lsi1"}
	`("$case", ({ item, message }) => {
		const error = validateItem(item, table);
		expect(error).toEqual(validationError(message));
	});

	it("should return undefined if the item is valid", () => {
		const item = {
			p_key: { S: "a".repeat(2048) },
			s_key: { S: "a".repeat(1024) },
		};
		const error = validateItem(item, table);
		expect(error).toEqual(undefined);
	});
});

describe("validateAttributeUpdates", () => {
	const table = {
		TableName: "test",
		KeySchema: [
			{ AttributeName: "p_key", KeyType: "HASH" },
			{ AttributeName: "s_key", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "p_key", AttributeType: "S" },
			{ AttributeName: "s_key", AttributeType: "S" },
			{ AttributeName: "gsi1_p_key", AttributeType: "S" },
			{ AttributeName: "gsi1_s_key", AttributeType: "S" },
			{ AttributeName: "lsi1_p_key", AttributeType: "S" },
			{ AttributeName: "lsi1_s_key", AttributeType: "S" },
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: "test_gsi1",
				KeySchema: [
					{ AttributeName: "gsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "gsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
		LocalSecondaryIndexes: [
			{
				IndexName: "test_lsi1",
				KeySchema: [
					{ AttributeName: "lsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "lsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
	} satisfies Table;

	it.each`
		case                                                                | attributeUpdates                                                       | message
		${"should return an error if the attribute is part of the key"}     | ${{ p_key: { S: "foo" } }}                                             | ${"One or more parameter values were invalid: Cannot update attribute p_key. This attribute is part of the key"}
		${"should return an error if the attribute is part of the key"}     | ${{ s_key: { S: "foo" } }}                                             | ${"One or more parameter values were invalid: Cannot update attribute s_key. This attribute is part of the key"}
		${"should return an error if the attribute is part of the gsi key"} | ${{ gsi1_p_key: { Action: "PUT", Value: { N: "1" } } }}                | ${"One or more parameter values were invalid: Type mismatch for Index Key gsi1_p_key Expected: S Actual: N IndexName: test_gsi1"}
		${"should return an error if the attribute is part of the gsi key"} | ${{ gsi1_s_key: { Action: "PUT", Value: { NS: ["1"] } } }}             | ${"One or more parameter values were invalid: Type mismatch for Index Key gsi1_s_key Expected: S Actual: NS IndexName: test_gsi1"}
		${"should return an error if the attribute is part of the lsi key"} | ${{ lsi1_p_key: { Action: "PUT", Value: { B: Buffer.from("foo") } } }} | ${"One or more parameter values were invalid: Type mismatch for Index Key lsi1_p_key Expected: S Actual: B IndexName: test_lsi1"}
		${"should return an error if the attribute is part of the lsi key"} | ${{ lsi1_s_key: { Action: "PUT", Value: { BOOL: "TRUE" } } }}          | ${"One or more parameter values were invalid: Type mismatch for Index Key lsi1_s_key Expected: S Actual: BOOL IndexName: test_lsi1"}
	`("$case", ({ attributeUpdates, message }) => {
		const error = validateAttributeUpdates(attributeUpdates, table);
		expect(error).toEqual(validationError(message));
	});

	it("should return undefined if the attributeUpdates is valid", () => {
		const error = validateAttributeUpdates(
			{ foo: { Action: "PUT", Value: { S: "bar" } } },
			table,
		);
		expect(error).toEqual(undefined);
	});
});

describe("validateExpressionUpdates", () => {
	const table = {
		TableName: "test",
		KeySchema: [
			{ AttributeName: "p_key", KeyType: "HASH" },
			{ AttributeName: "s_key", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "p_key", AttributeType: "S" },
			{ AttributeName: "s_key", AttributeType: "S" },
			{ AttributeName: "gsi1_p_key", AttributeType: "S" },
			{ AttributeName: "gsi1_s_key", AttributeType: "S" },
			{ AttributeName: "lsi1_p_key", AttributeType: "S" },
			{ AttributeName: "lsi1_s_key", AttributeType: "S" },
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: "test_gsi1",
				KeySchema: [
					{ AttributeName: "gsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "gsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
		LocalSecondaryIndexes: [
			{
				IndexName: "test_lsi1",
				KeySchema: [
					{ AttributeName: "lsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "lsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
	} satisfies Table;

	it.each`
		case                                                                 | sections                                        | nestedPaths        | message
		${"should return an error if sections include the key"}              | ${[{ path: ["p_key"], attrType: "S" }]}         | ${{ bar: true }}   | ${"One or more parameter values were invalid: Cannot update attribute p_key. This attribute is part of the key"}
		${"should return an error if sections include the key"}              | ${[{ path: ["s_key"], attrType: "S" }]}         | ${{ bar: true }}   | ${"One or more parameter values were invalid: Cannot update attribute s_key. This attribute is part of the key"}
		${"should return an error if mismatch the secondary index key type"} | ${[{ path: ["gsi1_p_key"], attrType: "N" }]}    | ${{ bar: true }}   | ${"One or more parameter values were invalid: Type mismatch for Index Key gsi1_p_key Expected: S Actual: N IndexName: test_gsi1"}
		${"should return an error if mismatch the secondary index key type"} | ${[{ path: ["gsi1_s_key"], attrType: "NS" }]}   | ${{ bar: true }}   | ${"One or more parameter values were invalid: Type mismatch for Index Key gsi1_s_key Expected: S Actual: NS IndexName: test_gsi1"}
		${"should return an error if mismatch the secondary index key type"} | ${[{ path: ["lsi1_p_key"], attrType: "B" }]}    | ${{ bar: true }}   | ${"One or more parameter values were invalid: Type mismatch for Index Key lsi1_p_key Expected: S Actual: B IndexName: test_lsi1"}
		${"should return an error if mismatch the secondary index key type"} | ${[{ path: ["lsi1_s_key"], attrType: "BOOL" }]} | ${{ bar: true }}   | ${"One or more parameter values were invalid: Type mismatch for Index Key lsi1_s_key Expected: S Actual: BOOL IndexName: test_lsi1"}
		${"should return an error if nestedPaths include the key"}           | ${[{ path: ["foo"], attrType: "S" }]}           | ${{ p_key: true }} | ${"Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: Key: p_key"}
	`("$case", ({ sections, nestedPaths, message }) => {
		const error = validateExpressionUpdates({ sections, nestedPaths }, table);
		expect(error).toEqual(validationError(message));
	});

	it("should return undefined if the expressionUpdates is valid", () => {
		const error = validateExpressionUpdates(
			{
				sections: [{ path: ["gsi1_p_key"], attrType: "S" }],
				nestedPaths: { bar: true },
			},
			table,
		);
		expect(error).toEqual(undefined);
	});
});

describe("validateKeyPiece", () => {
	it.each`
		case                                                      | key                                | attr     | type   | isHash   | message
		${"should return an error if the key piece is not valid"} | ${{ id: { S: "foo" } }}            | ${"xxx"} | ${"S"} | ${true}  | ${"The provided key element does not match the schema"}
		${"should return an error if the key piece is not valid"} | ${{ id: { S: "foo" } }}            | ${"id"}  | ${"B"} | ${true}  | ${"The provided key element does not match the schema"}
		${"should return an error if the key piece is empty"}     | ${{ id: { S: "" } }}               | ${"id"}  | ${"S"} | ${true}  | ${"One or more parameter values were invalid: The AttributeValue for a key attribute cannot contain an empty string value. Key: id"}
		${"should return an error if the key piece is empty"}     | ${{ id: { B: "" } }}               | ${"id"}  | ${"B"} | ${true}  | ${"One or more parameter values were invalid: The AttributeValue for a key attribute cannot contain an empty binary value. Key: id"}
		${"should return an error if the hash key is too long"}   | ${{ id: { S: "a".repeat(2049) } }} | ${"id"}  | ${"S"} | ${true}  | ${"One or more parameter values were invalid: Size of hashkey has exceeded the maximum size limit of2048 bytes"}
		${"should return an error if the range key is too long"}  | ${{ id: { S: "a".repeat(1025) } }} | ${"id"}  | ${"S"} | ${false} | ${"One or more parameter values were invalid: Aggregated size of all range keys has exceeded the size limit of 1024 bytes"}
	`("$case", ({ key, attr, type, isHash, message }) => {
		const error = validateKeyPiece(key, attr, type, isHash);
		expect(error).toEqual(validationError(message));
	});

	it("should return undefined if the key is number", () => {
		const key = { id: { N: "" } };
		const error = validateKeyPiece(key, "id", "N", true);
		expect(error).toEqual(undefined);
	});

	it("should return undefined if the key is valid string", () => {
		const key = { id: { S: "foo" } };
		const error = validateKeyPiece(key, "id", "S", true);
		expect(error).toEqual(undefined);
	});
});

describe("validateKeyPaths", () => {
	const table = {
		TableName: "test",
		KeySchema: [
			{ AttributeName: "p_key", KeyType: "HASH" },
			{ AttributeName: "s_key", KeyType: "RANGE" },
		],
		AttributeDefinitions: [
			{ AttributeName: "p_key", AttributeType: "S" },
			{ AttributeName: "s_key", AttributeType: "S" },
			{ AttributeName: "gsi1_p_key", AttributeType: "S" },
			{ AttributeName: "gsi1_s_key", AttributeType: "S" },
			{ AttributeName: "lsi1_p_key", AttributeType: "S" },
			{ AttributeName: "lsi1_s_key", AttributeType: "S" },
		],
		GlobalSecondaryIndexes: [
			{
				IndexName: "test_gsi1",
				KeySchema: [
					{ AttributeName: "gsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "gsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
		LocalSecondaryIndexes: [
			{
				IndexName: "test_lsi1",
				KeySchema: [
					{ AttributeName: "lsi1_p_key", KeyType: "HASH" },
					{ AttributeName: "lsi1_s_key", KeyType: "RANGE" },
				],
				Projection: { ProjectionType: "ALL" },
			},
		],
	} satisfies Table;

	it.each`
		path            | message
		${"p_key"}      | ${"Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: Key: p_key"}
		${"s_key"}      | ${"Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: Key: s_key"}
		${"gsi1_p_key"} | ${"Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: IndexKey: gsi1_p_key"}
		${"gsi1_s_key"} | ${"Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: IndexKey: gsi1_s_key"}
		${"lsi1_p_key"} | ${"Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: IndexKey: lsi1_p_key"}
		${"lsi1_s_key"} | ${"Key attributes must be scalars; list random access '[]' and map lookup '.' are not allowed: IndexKey: lsi1_s_key"}
	`("should return an error if $path is not valid", ({ path, message }) => {
		const nestedPaths = { [path]: true };
		const error = validateKeyPaths(nestedPaths, table);
		expect(error).toEqual(validationError(message));
	});

	it("should return an error if $path is not valid", () => {
		const nestedPaths = {};
		const error = validateKeyPaths(nestedPaths, table);
		expect(error).toEqual(undefined);
	});
});
