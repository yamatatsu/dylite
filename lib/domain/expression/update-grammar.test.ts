import { parse } from "./update-grammar";

describe("UpdateExpressionParser", () => {
	const context = {
		isReserved: () => false,
		attrVals: {
			":p": { N: "100" },
			":c": { SS: ["blue"] },
			":inc": { N: "1" },
		},
	};

	it("should parse a SET action", () => {
		const expression = "SET Price = :p, Color = :c";
		const result = parse(expression, { context });
		expect(result.sections[0].type).toBe("set");
		expect(result.sections.length).toBe(2);
	});

	it("should parse a REMOVE action", () => {
		const expression = "REMOVE InStock, Description";
		const result = parse(expression, { context });
		expect(result.sections[0].type).toBe("remove");
		expect(result.sections.length).toBe(2);
	});

	it("should parse an ADD action", () => {
		const expression = "ADD Quantity :inc";
		const result = parse(expression, { context });
		expect(result.sections[0].type).toBe("add");
	});

	it("should parse a DELETE action", () => {
		const expression = "DELETE AvailableColors :c";
		const result = parse(expression, { context });
		expect(result.sections[0].type).toBe("delete");
	});

	it("should parse multiple actions", () => {
		const expression = "SET Price = :p REMOVE OldAttr ADD OrderCount :inc";
		const result = parse(expression, { context });
		expect(result.sections.length).toBe(3);
	});
});
