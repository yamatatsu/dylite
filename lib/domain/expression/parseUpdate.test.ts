import { parseUpdate } from "./parseUpdate";

describe("parseUpdate", () => {
	it("should parse a SET action", () => {
		const result = parseUpdate("SET #p = :p, #c = :c", {
			ExpressionAttributeNames: { "#p": "Price", "#c": "Color" },
			ExpressionAttributeValues: {
				":p": { N: "100" },
				":c": { S: "blue" },
			},
		});
		expect(result).toEqual([
			{
				type: "set",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#p" })],
				},
				val: { type: "AttributeValue", name: ":p" },
				attrType: "N",
			},
			{
				type: "set",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#c" })],
				},
				val: { type: "AttributeValue", name: ":c" },
				attrType: "S",
			},
		]);
	});

	it("should parse a SET action with if_not_exists", () => {
		const result = parseUpdate("SET #p = if_not_exists(#p, :p)", {
			ExpressionAttributeNames: { "#p": "Price" },
			ExpressionAttributeValues: { ":p": { N: "100" } },
		});
		expect(result).toEqual([
			{
				type: "set",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#p" })],
				},
				val: {
					type: "function",
					name: "if_not_exists",
					args: [
						{
							type: "PathExpression",
							segments: [
								expect.objectContaining({ type: "Alias", name: "#p" }),
							],
						},
						{ type: "AttributeValue", name: ":p" },
					],
					attrType: "N",
				},
				attrType: "N",
			},
		]);
	});

	it("should parse a REMOVE action", () => {
		const result = parseUpdate("REMOVE #s, #d", {
			ExpressionAttributeNames: { "#s": "InStock", "#d": "Description" },
			ExpressionAttributeValues: undefined,
		});
		expect(result).toEqual([
			{
				type: "remove",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#s" })],
				},
			},
			{
				type: "remove",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#d" })],
				},
			},
		]);
	});

	it("should parse an ADD action", () => {
		const result = parseUpdate("ADD #q :v", {
			ExpressionAttributeNames: { "#q": "Quantity" },
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toEqual([
			{
				type: "add",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#q" })],
				},
				val: { type: "AttributeValue", name: ":v" },
				attrType: "N",
			},
		]);
	});

	it("should parse a DELETE action", () => {
		const result = parseUpdate("DELETE #c :v", {
			ExpressionAttributeNames: { "#c": "Colors" },
			ExpressionAttributeValues: { ":v": { SS: ["red"] } },
		});
		expect(result).toEqual([
			{
				type: "delete",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#c" })],
				},
				val: { type: "AttributeValue", name: ":v" },
				attrType: "SS",
			},
		]);
	});

	it("should parse multiple actions", () => {
		const result = parseUpdate("SET #p = :p REMOVE OldAttr ADD #q :v", {
			ExpressionAttributeNames: { "#p": "Price", "#q": "Quantity" },
			ExpressionAttributeValues: { ":p": { N: "100" }, ":v": { N: "1" } },
		});
		expect(result).toEqual([
			{
				type: "set",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#p" })],
				},
				val: { type: "AttributeValue", name: ":p" },
				attrType: "N",
			},
			{
				type: "remove",
				path: {
					type: "PathExpression",
					segments: [
						expect.objectContaining({ type: "Identifier", name: "OldAttr" }),
					],
				},
			},
			{
				type: "add",
				path: {
					type: "PathExpression",
					segments: [expect.objectContaining({ type: "Alias", name: "#q" })],
				},
				val: { type: "AttributeValue", name: ":v" },
				attrType: "N",
			},
		]);
	});

	it("should return an error for an update with a reserved word", () => {
		const result = parseUpdate("SET Count = :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"Attribute name is a reserved keyword; reserved keyword: Count",
		);
	});

	it("should throw a syntax error for an invalid update expression", () => {
		expect(() => {
			parseUpdate("SET Price =", {
				ExpressionAttributeNames: undefined,
				ExpressionAttributeValues: undefined,
			});
		}).toThrow('Expected "#", "(", ":", or [A-Z_a-z] but end of input found.');
	});

	it("should return an error for duplicate SET sections", () => {
		const result = parseUpdate("SET a = :v SET b = :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			'The "SET" section can only be used once in an update expression;',
		);
	});

	it("should return an error for an undefined expression attribute value", () => {
		const result = parseUpdate("SET a = :undefined", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"An expression attribute value used in expression is not defined; attribute value: :undefined",
		);
	});

	it("should return an error for incorrect operand type in ADD", () => {
		const result = parseUpdate("ADD a :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { S: "1" } },
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator: ADD, operand type: STRING",
		);
	});

	it("should return an error for overlapping paths", () => {
		const result = parseUpdate("SET a = :v, a.b = :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"Two document paths overlap with each other; must remove or rewrite one of these paths; path one: [a], path two: [a, b]",
		);
	});

	it("should return an error for duplicate REMOVE sections", () => {
		const result = parseUpdate("REMOVE a REMOVE b", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: undefined,
		});
		expect(result).toBe(
			'The "REMOVE" section can only be used once in an update expression;',
		);
	});

	it("should return an error for duplicate ADD sections", () => {
		const result = parseUpdate("ADD a :v ADD b :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			'The "ADD" section can only be used once in an update expression;',
		);
	});

	it("should return an error for duplicate DELETE sections", () => {
		const result = parseUpdate("DELETE a :v DELETE b :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { SS: ["test"] } },
		});
		expect(result).toBe(
			'The "DELETE" section can only be used once in an update expression;',
		);
	});

	it("should return an error for undefined expression attribute name", () => {
		const result = parseUpdate("SET #undefined = :v", {
			ExpressionAttributeNames: { "#p": "Price" },
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"An expression attribute name used in the document path is not defined; attribute name: #undefined",
		);
	});

	it("should return an error for conflicting document paths", () => {
		const result = parseUpdate("SET a[0] = :v, a.b = :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"Two document paths conflict with each other; must remove or rewrite one of these paths; path one: [a, [0]], path two: [a, b]",
		);
	});

	it("should return an error for unknown function name", () => {
		const result = parseUpdate("SET a = unknown_func(:v)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe("Invalid function name; function: unknown_func");
	});

	it("should return an error for incorrect number of operands for if_not_exists", () => {
		const result = parseUpdate("SET a = if_not_exists(:v)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"Incorrect number of operands for operator or function; operator or function: if_not_exists, number of operands: 1",
		);
	});

	it("should return an error for incorrect operand type for list_append", () => {
		const result = parseUpdate("SET a = list_append(:v1, :v2)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: {
				":v1": { S: "not a list" },
				":v2": { L: [] },
			},
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator or function: list_append, operand type: S",
		);
	});

	it("should return an error for incorrect operand type for plus operator", () => {
		const result = parseUpdate("SET a = :v1 + :v2", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: {
				":v1": { S: "not a number" },
				":v2": { N: "1" },
			},
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator or function: +, operand type: S",
		);
	});

	it("should return an error for incorrect operand type for minus operator", () => {
		const result = parseUpdate("SET a = :v1 - :v2", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: {
				":v1": { N: "10" },
				":v2": { S: "not a number" },
			},
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator or function: -, operand type: S",
		);
	});

	it("should return an error for incorrect operand type in DELETE", () => {
		const result = parseUpdate("DELETE a :v", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toBe(
			"Incorrect operand type for operator or function; operator: DELETE, operand type: NUMBER",
		);
	});

	it("should return an error for if_not_exists with non-path first argument", () => {
		const result = parseUpdate("SET a = if_not_exists(:v1, :v2)", {
			ExpressionAttributeNames: undefined,
			ExpressionAttributeValues: {
				":v1": { N: "1" },
				":v2": { N: "2" },
			},
		});
		expect(result).toBe(
			"Operator or function requires a document path; operator or function: if_not_exists",
		);
	});

	it("should throw a syntax error for nested arithmetic operations", () => {
		expect(() => {
			parseUpdate("SET a = :v1 + :v2 + :v3", {
				ExpressionAttributeNames: undefined,
				ExpressionAttributeValues: {
					":v1": { N: "1" },
					":v2": { N: "2" },
					":v3": { N: "3" },
				},
			});
		}).toThrow(
			'Expected ",", "ADD", "DELETE", "REMOVE", "SET", or end of input but "+" found.',
		);
	});

	it("should throw a syntax error for malformed list index", () => {
		expect(() => {
			parseUpdate("SET a[b] = :v", {
				ExpressionAttributeNames: undefined,
				ExpressionAttributeValues: { ":v": { N: "1" } },
			});
		}).toThrow('Expected [0-9] but "b" found.');
	});

	it("should throw a syntax error for empty expression", () => {
		expect(() => {
			parseUpdate("", {
				ExpressionAttributeNames: undefined,
				ExpressionAttributeValues: undefined,
			});
		}).toThrow(
			'Expected "ADD", "DELETE", "REMOVE", or "SET" but end of input found.',
		);
	});
});
