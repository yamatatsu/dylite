import { parseCondition } from "./parseCondition";

describe("parseCondition", () => {
	it("should parse a simple comparison with non-reserved words", () => {
		const result = parseCondition("Attr1 > :v1", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v1": { N: "5" } },
		});
		expect(result).toEqual({
			expression: {
				type: ">",
				args: [["Attr1"], { N: "5" }],
			},
			nestedPaths: {},
			pathHeads: { Attr1: true },
		});
	});

	it("should parse a comparison with ExpressionAttributeNames", () => {
		const result = parseCondition("#p > :v1", {
			ExpressionAttributeNames: { "#p": "Price" },
			ExpressionAttributeValues: { ":v1": { N: "100" } },
		});
		expect(result).toEqual({
			expression: {
				type: ">",
				args: [["Price"], { N: "100" }],
			},
			nestedPaths: {},
			pathHeads: { Price: true },
		});
	});

	it("should parse a BETWEEN expression", () => {
		const result = parseCondition("#p BETWEEN :lo AND :hi", {
			ExpressionAttributeNames: { "#p": "Price" },
			ExpressionAttributeValues: {
				":lo": { N: "0" },
				":hi": { N: "10" },
			},
		});
		expect(result).toEqual({
			expression: {
				type: "between",
				args: [["Price"], { N: "0" }, { N: "10" }],
			},
			nestedPaths: {},
			pathHeads: { Price: true },
		});
	});

	it("should parse an IN expression", () => {
		const result = parseCondition("#cat IN (:c1, :c2)", {
			ExpressionAttributeNames: { "#cat": "Category" },
			ExpressionAttributeValues: {
				":c1": { S: "Book" },
				":c2": { S: "Movie" },
			},
		});
		expect(result).toEqual({
			expression: {
				type: "in",
				args: [["Category"], { S: "Book" }, { S: "Movie" }],
			},
			nestedPaths: {},
			pathHeads: { Category: true },
		});
	});

	it("should parse a function call", () => {
		const result = parseCondition("attribute_exists(#id)", {
			ExpressionAttributeNames: { "#id": "Id" },
			ExpressionAttributeValues: undefined,
		});
		expect(result).toEqual({
			expression: {
				type: "function",
				name: "attribute_exists",
				args: [["Id"]],
				attrType: null,
			},
			nestedPaths: {},
			pathHeads: { Id: true },
		});
	});

	it("should parse a complex expression with AND, OR, NOT", () => {
		const result = parseCondition(
			"begins_with(#s, :prefix) AND (#p > :val OR (NOT #cat = :c))",
			{
				ExpressionAttributeNames: {
					"#s": "SK",
					"#p": "Price",
					"#cat": "Category",
				},
				ExpressionAttributeValues: {
					":prefix": { S: "abc" },
					":val": { N: "100" },
					":c": { S: "Book" },
				},
			},
		);
		expect(result).toEqual({
			expression: {
				type: "and",
				args: [
					{
						type: "function",
						name: "begins_with",
						args: [["SK"], { S: "abc" }],
						attrType: "BOOL",
					},
					{
						type: "or",
						args: [
							{ type: ">", args: [["Price"], { N: "100" }] },
							{
								type: "not",
								args: [{ type: "=", args: [["Category"], { S: "Book" }] }],
							},
						],
					},
				],
			},
			nestedPaths: {},
			pathHeads: { SK: true, Price: true, Category: true },
		});
	});

	it("should return an error for a condition with a reserved word", () => {
		const result = parseCondition("Count > :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"Attribute name is a reserved keyword; reserved keyword: Count",
		);
	});

	it("should throw a syntax error for an invalid condition expression", () => {
		expect(() => {
			parseCondition("Price > ", {
				ExpressionAttributeNames: undefined,
				ExpressionAttributeValues: undefined,
			});
		}).toThrow('Expected "#", "(", ":", or [A-Z_a-z] but end of input found.');
	});

	it("should return an error for undefined ExpressionAttributeValues", () => {
		const result = parseCondition("Price > :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: undefined,
		});
		expect(result).toBe(
			"An expression attribute value used in expression is not defined; attribute value: :v",
		);
	});
});
