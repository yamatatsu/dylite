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
		expect(result).toEqual({
			sections: [
				{ type: "set", path: ["Price"], val: { N: "100" }, attrType: "N" },
				{ type: "set", path: ["Color"], val: { S: "blue" }, attrType: "S" },
			],
			paths: [["Price"], ["Color"]],
			nestedPaths: {},
		});
	});

	it("should parse a SET action with if_not_exists", () => {
		const result = parseUpdate("SET #p = if_not_exists(#p, :p)", {
			ExpressionAttributeNames: { "#p": "Price" },
			ExpressionAttributeValues: { ":p": { N: "100" } },
		});
		expect(result).toEqual({
			sections: [
				{
					type: "set",
					path: ["Price"],
					val: {
						type: "function",
						name: "if_not_exists",
						args: [["Price"], { N: "100" }],
						attrType: "N",
					},
					attrType: "N",
				},
			],
			paths: [["Price"]],
			nestedPaths: {},
		});
	});

	it("should parse a REMOVE action", () => {
		const result = parseUpdate("REMOVE #s, #d", {
			ExpressionAttributeNames: { "#s": "InStock", "#d": "Description" },
			ExpressionAttributeValues: undefined,
		});
		expect(result).toEqual({
			sections: [
				{ type: "remove", path: ["InStock"] },
				{ type: "remove", path: ["Description"] },
			],
			paths: [["InStock"], ["Description"]],
			nestedPaths: {},
		});
	});

	it("should parse an ADD action", () => {
		const result = parseUpdate("ADD #q :v", {
			ExpressionAttributeNames: { "#q": "Quantity" },
			ExpressionAttributeValues: { ":v": { N: "1" } },
		});
		expect(result).toEqual({
			sections: [
				{ type: "add", path: ["Quantity"], val: { N: "1" }, attrType: "N" },
			],
			paths: [["Quantity"]],
			nestedPaths: {},
		});
	});

	it("should parse a DELETE action", () => {
		const result = parseUpdate("DELETE #c :v", {
			ExpressionAttributeNames: { "#c": "Colors" },
			ExpressionAttributeValues: { ":v": { SS: ["red"] } },
		});
		expect(result).toEqual({
			sections: [
				{
					type: "delete",
					path: ["Colors"],
					val: { SS: ["red"] },
					attrType: "SS",
				},
			],
			paths: [["Colors"]],
			nestedPaths: {},
		});
	});

	it("should parse multiple actions", () => {
		const result = parseUpdate("SET #p = :p REMOVE OldAttr ADD #q :v", {
			ExpressionAttributeNames: { "#p": "Price", "#q": "Quantity" },
			ExpressionAttributeValues: { ":p": { N: "100" }, ":v": { N: "1" } },
		});
		expect(result).toEqual({
			sections: [
				{ type: "set", path: ["Price"], val: { N: "100" }, attrType: "N" },
				{ type: "remove", path: ["OldAttr"] },
				{ type: "add", path: ["Quantity"], val: { N: "1" }, attrType: "N" },
			],
			paths: [["Price"], ["OldAttr"], ["Quantity"]],
			nestedPaths: {},
		});
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
});
