import { compare } from "./compare";

test.each`
	comps                               | val                | compVals                    | expected
	${["EQ", "="]}                      | ${{ S: "foo" }}    | ${[{ B: "foo" }]}           | ${false}
	${["EQ", "="]}                      | ${{ S: "foo" }}    | ${[{ S: "foo" }]}           | ${true}
	${["EQ", "="]}                      | ${{ S: "foo" }}    | ${[{ S: "bar" }]}           | ${false}
	${["EQ", "="]}                      | ${{ B: "YQ==" }}   | ${[{ B: "YQ==" }]}          | ${true}
	${["EQ", "="]}                      | ${{ B: "YQ==" }}   | ${[{ B: "Yg==" }]}          | ${false}
	${["EQ", "="]}                      | ${{ N: "0" }}      | ${[{ N: "0" }]}             | ${true}
	${["EQ", "="]}                      | ${{ N: "0" }}      | ${[{ N: "1" }]}             | ${false}
	${["NE", "<>"]}                     | ${{ S: "foo" }}    | ${[{ B: "YQ==" }]}          | ${true}
	${["NE", "<>"]}                     | ${{ S: "foo" }}    | ${[{ S: "foo" }]}           | ${false}
	${["NE", "<>"]}                     | ${{ S: "foo" }}    | ${[{ S: "bar" }]}           | ${true}
	${["NE", "<>"]}                     | ${{ B: "YQ==" }}   | ${[{ B: "YQ==" }]}          | ${false}
	${["NE", "<>"]}                     | ${{ B: "YQ==" }}   | ${[{ B: "Yg==" }]}          | ${true}
	${["NE", "<>"]}                     | ${{ N: "0" }}      | ${[{ N: "0" }]}             | ${false}
	${["NE", "<>"]}                     | ${{ N: "0" }}      | ${[{ N: "1" }]}             | ${true}
	${["LE", "<="]}                     | ${{ S: "a" }}      | ${[{ N: "1" }]}             | ${false}
	${["LE", "<="]}                     | ${{ S: "a" }}      | ${[{ S: "a" }]}             | ${true}
	${["LE", "<="]}                     | ${{ S: "b" }}      | ${[{ S: "a" }]}             | ${false}
	${["LE", "<="]}                     | ${{ B: "YQ==" }}   | ${[{ B: "YQ==" }]}          | ${true}
	${["LE", "<="]}                     | ${{ B: "Yg==" }}   | ${[{ B: "YQ==" }]}          | ${false}
	${["LE", "<="]}                     | ${{ N: "0" }}      | ${[{ N: "0" }]}             | ${true}
	${["LE", "<="]}                     | ${{ N: "1" }}      | ${[{ N: "0" }]}             | ${false}
	${["LT", "<"]}                      | ${{ S: "a" }}      | ${[{ N: "1" }]}             | ${false}
	${["LT", "<"]}                      | ${{ S: "a" }}      | ${[{ S: "b" }]}             | ${true}
	${["LT", "<"]}                      | ${{ S: "a" }}      | ${[{ S: "a" }]}             | ${false}
	${["LT", "<"]}                      | ${{ B: "YQ==" }}   | ${[{ B: "Yg==" }]}          | ${true}
	${["LT", "<"]}                      | ${{ B: "YQ==" }}   | ${[{ B: "YQ==" }]}          | ${false}
	${["LT", "<"]}                      | ${{ N: "0" }}      | ${[{ N: "1" }]}             | ${true}
	${["LT", "<"]}                      | ${{ N: "0" }}      | ${[{ N: "0" }]}             | ${false}
	${["GE", ">="]}                     | ${{ S: "a" }}      | ${[{ N: "1" }]}             | ${false}
	${["GE", ">="]}                     | ${{ S: "a" }}      | ${[{ S: "a" }]}             | ${true}
	${["GE", ">="]}                     | ${{ S: "a" }}      | ${[{ S: "b" }]}             | ${false}
	${["GE", ">="]}                     | ${{ B: "YQ==" }}   | ${[{ B: "YQ==" }]}          | ${true}
	${["GE", ">="]}                     | ${{ B: "YQ==" }}   | ${[{ B: "Yg==" }]}          | ${false}
	${["GE", ">="]}                     | ${{ N: "0" }}      | ${[{ N: "0" }]}             | ${true}
	${["GE", ">="]}                     | ${{ N: "0" }}      | ${[{ N: "1" }]}             | ${false}
	${["GT", ">"]}                      | ${{ S: "a" }}      | ${[{ N: "1" }]}             | ${false}
	${["GT", ">"]}                      | ${{ S: "b" }}      | ${[{ S: "a" }]}             | ${true}
	${["GT", ">"]}                      | ${{ S: "a" }}      | ${[{ S: "a" }]}             | ${false}
	${["GT", ">"]}                      | ${{ B: "Yg==" }}   | ${[{ B: "YQ==" }]}          | ${true}
	${["GT", ">"]}                      | ${{ B: "YQ==" }}   | ${[{ B: "YQ==" }]}          | ${false}
	${["GT", ">"]}                      | ${{ N: "1" }}      | ${[{ N: "0" }]}             | ${true}
	${["GT", ">"]}                      | ${{ N: "0" }}      | ${[{ N: "0" }]}             | ${false}
	${["NOT_NULL", "attribute_exists"]} | ${{ S: "foo" }}    | ${[]}                       | ${true}
	${["NOT_NULL", "attribute_exists"]} | ${{ S: null }}     | ${[]}                       | ${false}
	${["NULL", "attribute_not_exists"]} | ${{ S: "foo" }}    | ${[]}                       | ${false}
	${["NULL", "attribute_not_exists"]} | ${{ S: null }}     | ${[]}                       | ${true}
	${["CONTAINS", "contains"]}         | ${{ S: "foo" }}    | ${[{ S: "fo" }]}            | ${true}
	${["CONTAINS", "contains"]}         | ${{ S: "foo" }}    | ${[{ S: "a" }]}             | ${false}
	${["CONTAINS", "contains"]}         | ${{ SS: ["foo"] }} | ${[{ S: "foo" }]}           | ${true}
	${["CONTAINS", "contains"]}         | ${{ SS: ["bar"] }} | ${[{ S: "foo" }]}           | ${false}
	${["NOT_CONTAINS"]}                 | ${{ S: "foo" }}    | ${[{ S: "fo" }]}            | ${false}
	${["NOT_CONTAINS"]}                 | ${{ S: "foo" }}    | ${[{ S: "a" }]}             | ${true}
	${["NOT_CONTAINS"]}                 | ${{ SS: ["foo"] }} | ${[{ S: "foo" }]}           | ${false}
	${["NOT_CONTAINS"]}                 | ${{ SS: ["fo"] }}  | ${[{ S: "foo" }]}           | ${true}
	${["BEGINS_WITH"]}                  | ${{ B: "YQ==" }}   | ${[{ S: "YQ" }]}            | ${false}
	${["BEGINS_WITH"]}                  | ${{ S: "foo" }}    | ${[{ S: "fo" }]}            | ${true}
	${["BEGINS_WITH"]}                  | ${{ S: "foo" }}    | ${[{ S: "fa" }]}            | ${false}
	${["IN", "in"]}                     | ${{ S: "foo" }}    | ${[{ S: "foo" }]}           | ${true}
	${["IN", "in"]}                     | ${{ S: "foo" }}    | ${[{ S: "bar" }]}           | ${false}
	${["BETWEEN", "between"]}           | ${{ N: "1" }}      | ${[{ N: "0" }, { N: "1" }]} | ${true}
	${["BETWEEN", "between"]}           | ${{ N: "2" }}      | ${[{ N: "0" }, { N: "1" }]} | ${false}
	${["BETWEEN", "between"]}           | ${{ S: "b" }}      | ${[{ S: "a" }, { S: "b" }]} | ${true}
	${["BETWEEN", "between"]}           | ${{ S: "c" }}      | ${[{ S: "a" }, { S: "b" }]} | ${false}
`("$#: $comps", ({ comps, val, compVals, expected }) => {
	for (const comp of comps) {
		expect(compare(comp, val, compVals)).toBe(expected);
	}
});
