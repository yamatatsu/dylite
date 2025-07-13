import { parseCondition } from "./parseCondition";

describe("parseCondition", () => {
	it("should parse a simple comparison with non-reserved words", () => {
		const result = parseCondition("Attr1 > :v1", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v1": { N: "5" } },
		});
		expect(result).toEqual({
			type: ">",
			args: [
				{
					type: "PathExpression",
					segments: [
						expect.objectContaining({ type: "Identifier", name: "Attr1" }),
					],
				},
				{ type: "AttributeValue", name: ":v1" },
			],
		});
	});

	it("should parse a comparison with ExpressionAttributeNames", () => {
		const result = parseCondition("#p > :v1", {
			ExpressionAttributeNames: { "#p": "Price" },
			ExpressionAttributeValues: { ":v1": { N: "100" } },
		});
		expect(result).toEqual({
			type: ">",
			args: [
				{
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#p" })],
				},
				{ type: "AttributeValue", name: ":v1" },
			],
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
			type: "between",
			args: [
				{
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#p" })],
				},
				{ type: "AttributeValue", name: ":lo" },
				{ type: "AttributeValue", name: ":hi" },
			],
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
			type: "in",
			args: [
				{
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#cat" })],
				},
				{ type: "AttributeValue", name: ":c1" },
				{ type: "AttributeValue", name: ":c2" },
			],
		});
	});

	it("should parse a function call", () => {
		const result = parseCondition("attribute_exists(#id)", {
			ExpressionAttributeNames: { "#id": "Id" },
			ExpressionAttributeValues: undefined,
		});
		expect(result).toEqual({
			type: "function",
			name: "attribute_exists",
			args: [
				{
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#id" })],
				},
			],
			attrType: null,
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
			type: "and",
			args: [
				{
					type: "function",
					name: "begins_with",
					args: [
						{
							type: "PathExpression",
							segments: [
								expect.objectContaining({ type: "Alias", name: "#s" }),
							],
						},
						{ type: "AttributeValue", name: ":prefix" },
					],
					attrType: "BOOL",
				},
				{
					type: "or",
					args: [
						{
							type: ">",
							args: [
								{
									type: "PathExpression",
									segments: [
										expect.objectContaining({ type: "Alias", name: "#p" }),
									],
								},
								{ type: "AttributeValue", name: ":val" },
							],
						},
						{
							type: "not",
							args: [
								{
									type: "=",
									args: [
										{
											type: "PathExpression",
											segments: [
												expect.objectContaining({
													type: "Alias",
													name: "#cat",
												}),
											],
										},
										{ type: "AttributeValue", name: ":c" },
									],
								},
							],
						},
					],
				},
			],
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

	it("should return an error for an undefined expression attribute name", () => {
		const result = parseCondition("#undefined > :v", {
			ExpressionAttributeNames: { "#p": "Price" },
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"An expression attribute name used in the document path is not defined; attribute name: #undefined",
		);
	});

	it("should return an error for incorrect number of function operands", () => {
		const result = parseCondition("attribute_exists(Attr1, Attr2)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: undefined,
		});
		expect(result).toBe(
			"Incorrect number of operands for operator or function; operator or function: attribute_exists, number of operands: 2",
		);
	});

	it("should return an error for incorrect operand type", () => {
		const result = parseCondition("begins_with(:v, :v)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator or function: begins_with, operand type: N",
		);
	});

	it("should return an error for different data types in BETWEEN", () => {
		const result = parseCondition("Attr1 BETWEEN :lo AND :hi", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: {
				":lo": { N: "1" },
				":hi": { S: "10" },
			},
		});
		expect(result).toBe(
			"The BETWEEN operator requires same data type for lower and upper bounds; lower bound operand: AttributeValue: {N:1}, upper bound operand: AttributeValue: {S:10}",
		);
	});

	it("should return an error for a comparison between the same path", () => {
		const result = parseCondition("MyAttr = MyAttr", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: undefined,
		});
		expect(result).toBe(
			"The first operand must be distinct from the remaining operands for this operator or function; operator: =, first operand: [MyAttr]",
		);
	});

	it("should return an error for a misused function in a comparison", () => {
		const result = parseCondition("begins_with(MyAttr, :v) = :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { S: "abc" } },
		});
		expect(result).toBe(
			"The function is not allowed to be used this way in an expression; function: begins_with",
		);
	});

	it("should return an error for an invalid function name", () => {
		const result = parseCondition("invalid_function(MyAttr)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: undefined,
		});
		expect(result).toBe("Invalid function name; function: invalid_function");
	});

	it("should return an error for an invalid attribute type in attribute_type()", () => {
		const result = parseCondition("attribute_type(MyAttr, :v)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { S: "INVALID" } },
		});
		expect(result).toBe(
			"Invalid attribute type name found; type: INVALID, valid types: {B,NULL,SS,BOOL,L,BS,N,NS,S,M}",
		);
	});

	it("should return an error for redundant parentheses", () => {
		const result = parseCondition("((Attr1 > :v1))", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v1": { N: "5" } },
		});
		expect(result).toBe("The expression has redundant parentheses;");
	});

	it("should return an error when a function requiring a path gets a value", () => {
		const result = parseCondition("attribute_exists(:v)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { S: "someValue" } },
		});
		expect(result).toBe(
			"Operator or function requires a document path; operator or function: attribute_exists",
		);
	});

	it("should return an error for size() with an invalid operand type", () => {
		const result = parseCondition("size(:v) > :zero", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: {
				":v": { N: "123" },
				":zero": { N: "0" },
			},
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator or function: size, operand type: N",
		);
	});

	it("should return an error for attribute_type() with a non-string type value", () => {
		const result = parseCondition("attribute_type(MyAttr, :v)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "123" } },
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator or function: attribute_type, operand type: N",
		);
	});

	it("should return an error for using size() as a standalone condition", () => {
		const result = parseCondition("size(MyAttr)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: undefined,
		});
		expect(result).toBe(
			"The function is not allowed to be used this way in an expression; function: size",
		);
	});
});
