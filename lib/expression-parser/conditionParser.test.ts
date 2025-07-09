import { compare } from "../db/compare";
import { parse } from "./conditionParser";

describe("ConditionExpressionParser", () => {
	const context = {
		isReserved: () => false,
		attrVals: {
			":pr": { N: "5" },
			":lo": { N: "0" },
			":hi": { N: "10" },
			":cat1": { S: "Category1" },
			":cat2": { S: "Category2" },
			":p": { N: "100" },
			":prefix": { S: "prefix" },
		},
		compare,
	};

	it("should parse a simple comparison", () => {
		const expression = "Price > :pr";
		const result = parse(expression, { context });
		expect(result.expression.type).toBe(">");
	});

	it("should parse a BETWEEN expression", () => {
		const expression = "Price BETWEEN :lo AND :hi";
		const result = parse(expression, { context });
		expect(result.expression.type).toBe("between");
	});

	it("should parse an IN expression", () => {
		const expression = "ProductCategory IN (:cat1, :cat2)";
		const result = parse(expression, { context });
		expect(result.expression.type).toBe("in");
	});

	it("should parse a function call", () => {
		const expression = "attribute_not_exists(Id)";
		const result = parse(expression, { context });
		expect(result.expression.type).toBe("function");
		expect(result.expression.name).toBe("attribute_not_exists");
	});

	it("should parse a complex expression with AND, OR, and NOT", () => {
		const expression =
			"(ProductCategory IN (:cat1, :cat2)) AND (Price > :p OR NOT begins_with(SK, :prefix))";
		const result = parse(expression, { context });
		expect(result.expression.type).toBe("and");
	});

	it("should handle nested attributes", () => {
		const expression = "attribute_exists(ProductReviews.OneStar)";
		const result = parse(expression, { context });
		expect(result.expression.type).toBe("function");
		expect(result.expression.name).toBe("attribute_exists");
	});
});
