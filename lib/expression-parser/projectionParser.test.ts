import { parse } from "./projectionParser";

describe("ProjectionExpressionParser", () => {
  const context = {
    isReserved: () => false,
    attrNames: { "#c": "Comment", "#price": "Price-USD" },
  };

  it("should parse a single attribute", () => {
    const expression = "Title";
    const result = parse(expression, { context });
    expect(result.paths).toEqual([["Title"]]);
  });

  it("should parse multiple attributes", () => {
    const expression = "Title, Price, Color";
    const result = parse(expression, { context });
    expect(result.paths).toEqual([["Title"], ["Price"], ["Color"]]);
  });

  it("should parse nested attributes", () => {
    const expression = "ProductReviews.FiveStar, ProductReviews.OneStar";
    const result = parse(expression, { context });
    expect(result.paths).toEqual([
      ["ProductReviews", "FiveStar"],
      ["ProductReviews", "OneStar"],
    ]);
    expect(result.nestedPaths).toEqual({ ProductReviews: true });
  });

  it("should parse list elements", () => {
    const expression = "RelatedItems[0], Reviews[1].Author";
    const result = parse(expression, { context });
    expect(result.paths).toEqual([
      ["RelatedItems", 0],
      ["Reviews", 1, "Author"],
    ]);
    expect(result.nestedPaths).toEqual({ RelatedItems: true, Reviews: true });
  });

  it("should handle expression attribute names", () => {
    const expression = "#c, #price";
    const result = parse(expression, { context });
    expect(result.paths).toEqual([["Comment"], ["Price-USD"]]);
  });
});