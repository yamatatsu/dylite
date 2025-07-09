import { parseProjection } from "./parseProjection";

describe("parseProjection", () => {
	it("should parse a simple projection expression with non-reserved words", () => {
		const result = parseProjection("Attr1, Attr2", {
			ExpressionAttributeNames: undefined,
		});
		expect(result).toEqual({
			paths: [["Attr1"], ["Attr2"]],
			nestedPaths: {},
		});
	});

	it("should parse a projection expression using attribute names for all identifiers", () => {
		const result = parseProjection("#n, #a", {
			ExpressionAttributeNames: {
				"#n": "Name", // Name is a reserved word
				"#a": "Age",
			},
		});
		expect(result).toEqual({
			paths: [["Name"], ["Age"]],
			nestedPaths: {},
		});
	});

	it("should parse a projection expression with nested attributes", () => {
		const result = parseProjection("Product.Price, #b", {
			ExpressionAttributeNames: {
				"#b": "Brand", // Brand is not reserved, but good practice
			},
		});
		expect(result).toEqual({
			paths: [["Product", "Price"], ["Brand"]],
			nestedPaths: { Product: true },
		});
	});

	it("should parse a projection expression with list elements", () => {
		const result = parseProjection("#i[0], #i[1].#n", {
			ExpressionAttributeNames: {
				"#i": "Items", // Items is a reserved word
				"#n": "Name", // Name is a reserved word
			},
		});
		expect(result).toEqual({
			paths: [
				["Items", 0],
				["Items", 1, "Name"],
			],
			nestedPaths: { Items: true },
		});
	});

	it("should parse a mixed projection expression", () => {
		const result = parseProjection("Id, #n, Product.Price, #i[0]", {
			ExpressionAttributeNames: {
				"#n": "Name", // Name is a reserved word
				"#i": "Items", // Items is a reserved word
			},
		});
		expect(result).toEqual({
			paths: [["Id"], ["Name"], ["Product", "Price"], ["Items", 0]],
			nestedPaths: { Product: true, Items: true },
		});
	});

	it("should return an error for a projection expression with a reserved word", () => {
		const result = parseProjection("Year, Count", {
			ExpressionAttributeNames: undefined,
		});
		expect(result).toBe(
			"Attribute name is a reserved keyword; reserved keyword: Year",
		);
	});

	it("should throw a syntax error for an invalid projection expression", () => {
		expect(() => {
			parseProjection("Id,,Name", { ExpressionAttributeNames: undefined });
		}).toThrow('Expected "#" or [A-Z_a-z] but "," found.');
	});

	it("should return an error for an undefined expression attribute name", () => {
		const result = parseProjection("#undefined", {
			ExpressionAttributeNames: { "#n": "Name" },
		});
		expect(result).toBe(
			"An expression attribute name used in the document path is not defined; attribute name: #undefined",
		);
	});

	it("should return an error for conflicting document paths", () => {
		const result = parseProjection("MyAttr.SubAttr, MyAttr[0]", {
			ExpressionAttributeNames: undefined,
		});
		expect(result).toBe(
			"Two document paths conflict with each other; must remove or rewrite one of these paths; path one: [MyAttr, SubAttr], path two: [MyAttr, [0]]",
		);
	});

	it("should return an error for overlapping document paths", () => {
		const result = parseProjection("MyAttr, MyAttr.SubAttr", {
			ExpressionAttributeNames: undefined,
		});
		expect(result).toBe(
			"Two document paths overlap with each other; must remove or rewrite one of these paths; path one: [MyAttr], path two: [MyAttr, SubAttr]",
		);
	});
});
