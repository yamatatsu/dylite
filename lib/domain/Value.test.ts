import {
	BOOLValue,
	BSValue,
	BValue,
	LValue,
	MValue,
	NSValue,
	NULLValue,
	NValue,
	SSValue,
	SValue,
	plainToValue,
} from "./Value";

describe("Value comparison operators", () => {
	describe("eq (equals)", () => {
		test.each`
			val1                                                | val2                                                | expected
			${{ S: "foo" }}                                     | ${{ S: "foo" }}                                     | ${true}
			${{ S: "foo" }}                                     | ${{ S: "bar" }}                                     | ${false}
			${{ S: "foo" }}                                     | ${{ B: "Zm9v" }}                                    | ${false}
			${{ N: "0" }}                                       | ${{ N: "0" }}                                       | ${true}
			${{ N: "0" }}                                       | ${{ N: "1" }}                                       | ${false}
			${{ N: "0" }}                                       | ${{ S: "0" }}                                       | ${false}
			${{ B: "YQ==" }}                                    | ${{ B: "YQ==" }}                                    | ${true}
			${{ B: "YQ==" }}                                    | ${{ B: "Yg==" }}                                    | ${false}
			${{ B: "YQ==" }}                                    | ${{ S: "a" }}                                       | ${false}
			${{ BOOL: true }}                                   | ${{ BOOL: true }}                                   | ${true}
			${{ BOOL: true }}                                   | ${{ BOOL: false }}                                  | ${false}
			${{ BOOL: true }}                                   | ${{ S: "true" }}                                    | ${false}
			${{ NULL: true }}                                   | ${{ NULL: true }}                                   | ${true}
			${{ NULL: true }}                                   | ${{ S: "" }}                                        | ${false}
			${{ SS: ["a", "b"] }}                               | ${{ SS: ["a", "b"] }}                               | ${true}
			${{ SS: ["a", "b"] }}                               | ${{ SS: ["b", "a"] }}                               | ${false}
			${{ NS: ["1", "2"] }}                               | ${{ NS: ["1", "2"] }}                               | ${true}
			${{ NS: ["1", "2"] }}                               | ${{ NS: ["2", "1"] }}                               | ${false}
			${{ BS: ["YQ==", "Yg=="] }}                         | ${{ BS: ["YQ==", "Yg=="] }}                         | ${true}
			${{ BS: ["YQ==", "Yg=="] }}                         | ${{ BS: ["Yg==", "YQ=="] }}                         | ${false}
			${{ L: [{ S: "a" }, { N: "1" }] }}                  | ${{ L: [{ S: "a" }, { N: "1" }] }}                  | ${true}
			${{ L: [{ S: "a" }, { N: "1" }] }}                  | ${{ L: [{ S: "b" }, { N: "1" }] }}                  | ${false}
			${{ M: { key1: { S: "val1" }, key2: { N: "2" } } }} | ${{ M: { key1: { S: "val1" }, key2: { N: "2" } } }} | ${true}
			${{ M: { key1: { S: "val1" }, key2: { N: "2" } } }} | ${{ M: { key1: { S: "val2" }, key2: { N: "2" } } }} | ${false}
		`("$val1 eq $val2 = $expected", ({ val1, val2, expected }) => {
			const value1 = plainToValue(val1);
			const value2 = plainToValue(val2);
			expect(value1.eq(value2)).toBe(expected);
		});
	});

	describe("ne (not equals)", () => {
		test.each`
			val1            | val2             | expected
			${{ S: "foo" }} | ${{ S: "foo" }}  | ${false}
			${{ S: "foo" }} | ${{ S: "bar" }}  | ${true}
			${{ S: "foo" }} | ${{ B: "Zm9v" }} | ${true}
			${{ N: "0" }}   | ${{ N: "0" }}    | ${false}
			${{ N: "0" }}   | ${{ N: "1" }}    | ${true}
			${{ N: "0" }}   | ${{ S: "0" }}    | ${true}
		`("$val1 ne $val2 = $expected", ({ val1, val2, expected }) => {
			const value1 = plainToValue(val1);
			const value2 = plainToValue(val2);
			expect(value1.ne(value2)).toBe(expected);
		});
	});

	describe("lt (less than)", () => {
		test.each`
			val1               | val2               | expected
			${{ S: "a" }}      | ${{ S: "b" }}      | ${true}
			${{ S: "a" }}      | ${{ S: "a" }}      | ${false}
			${{ S: "b" }}      | ${{ S: "a" }}      | ${false}
			${{ S: "a" }}      | ${{ N: "1" }}      | ${false}
			${{ N: "0" }}      | ${{ N: "1" }}      | ${true}
			${{ N: "0" }}      | ${{ N: "0" }}      | ${false}
			${{ N: "1" }}      | ${{ N: "0" }}      | ${false}
			${{ N: "0" }}      | ${{ S: "1" }}      | ${false}
			${{ B: "YQ==" }}   | ${{ B: "Yg==" }}   | ${true}
			${{ B: "YQ==" }}   | ${{ B: "YQ==" }}   | ${false}
			${{ B: "Yg==" }}   | ${{ B: "YQ==" }}   | ${false}
			${{ BOOL: false }} | ${{ BOOL: true }}  | ${true}
			${{ BOOL: true }}  | ${{ BOOL: false }} | ${false}
		`("$val1 lt $val2 = $expected", ({ val1, val2, expected }) => {
			const value1 = plainToValue(val1);
			const value2 = plainToValue(val2);
			expect(value1.lt(value2)).toBe(expected);
		});
	});

	describe("le (less than or equal)", () => {
		test.each`
			val1             | val2             | expected
			${{ S: "a" }}    | ${{ S: "b" }}    | ${true}
			${{ S: "a" }}    | ${{ S: "a" }}    | ${true}
			${{ S: "b" }}    | ${{ S: "a" }}    | ${false}
			${{ S: "a" }}    | ${{ N: "1" }}    | ${false}
			${{ N: "0" }}    | ${{ N: "1" }}    | ${true}
			${{ N: "0" }}    | ${{ N: "0" }}    | ${true}
			${{ N: "1" }}    | ${{ N: "0" }}    | ${false}
			${{ B: "YQ==" }} | ${{ B: "Yg==" }} | ${true}
			${{ B: "YQ==" }} | ${{ B: "YQ==" }} | ${true}
			${{ B: "Yg==" }} | ${{ B: "YQ==" }} | ${false}
		`("$val1 le $val2 = $expected", ({ val1, val2, expected }) => {
			const value1 = plainToValue(val1);
			const value2 = plainToValue(val2);
			expect(value1.le(value2)).toBe(expected);
		});
	});

	describe("gt (greater than)", () => {
		test.each`
			val1               | val2               | expected
			${{ S: "b" }}      | ${{ S: "a" }}      | ${true}
			${{ S: "a" }}      | ${{ S: "a" }}      | ${false}
			${{ S: "a" }}      | ${{ S: "b" }}      | ${false}
			${{ S: "a" }}      | ${{ N: "1" }}      | ${false}
			${{ N: "1" }}      | ${{ N: "0" }}      | ${true}
			${{ N: "0" }}      | ${{ N: "0" }}      | ${false}
			${{ N: "0" }}      | ${{ N: "1" }}      | ${false}
			${{ B: "Yg==" }}   | ${{ B: "YQ==" }}   | ${true}
			${{ B: "YQ==" }}   | ${{ B: "YQ==" }}   | ${false}
			${{ B: "YQ==" }}   | ${{ B: "Yg==" }}   | ${false}
			${{ BOOL: true }}  | ${{ BOOL: false }} | ${true}
			${{ BOOL: false }} | ${{ BOOL: true }}  | ${false}
		`("$val1 gt $val2 = $expected", ({ val1, val2, expected }) => {
			const value1 = plainToValue(val1);
			const value2 = plainToValue(val2);
			expect(value1.gt(value2)).toBe(expected);
		});
	});

	describe("ge (greater than or equal)", () => {
		test.each`
			val1             | val2             | expected
			${{ S: "b" }}    | ${{ S: "a" }}    | ${true}
			${{ S: "a" }}    | ${{ S: "a" }}    | ${true}
			${{ S: "a" }}    | ${{ S: "b" }}    | ${false}
			${{ S: "a" }}    | ${{ N: "1" }}    | ${false}
			${{ N: "1" }}    | ${{ N: "0" }}    | ${true}
			${{ N: "0" }}    | ${{ N: "0" }}    | ${true}
			${{ N: "0" }}    | ${{ N: "1" }}    | ${false}
			${{ B: "Yg==" }} | ${{ B: "YQ==" }} | ${true}
			${{ B: "YQ==" }} | ${{ B: "YQ==" }} | ${true}
			${{ B: "YQ==" }} | ${{ B: "Yg==" }} | ${false}
		`("$val1 ge $val2 = $expected", ({ val1, val2, expected }) => {
			const value1 = plainToValue(val1);
			const value2 = plainToValue(val2);
			expect(value1.ge(value2)).toBe(expected);
		});
	});

	describe("comparison throws for collections", () => {
		test.each`
			val1                        | val2                        | method
			${{ SS: ["a", "b"] }}       | ${{ SS: ["a", "b"] }}       | ${"lt"}
			${{ NS: ["1", "2"] }}       | ${{ NS: ["1", "2"] }}       | ${"lt"}
			${{ BS: ["YQ=="] }}         | ${{ BS: ["YQ=="] }}         | ${"lt"}
			${{ M: { k: { S: "v" } } }} | ${{ M: { k: { S: "v" } } }} | ${"lt"}
			${{ L: [{ S: "a" }] }}      | ${{ L: [{ S: "a" }] }}      | ${"lt"}
			${{ SS: ["a", "b"] }}       | ${{ SS: ["a", "b"] }}       | ${"gt"}
			${{ NS: ["1", "2"] }}       | ${{ NS: ["1", "2"] }}       | ${"gt"}
			${{ BS: ["YQ=="] }}         | ${{ BS: ["YQ=="] }}         | ${"gt"}
			${{ M: { k: { S: "v" } } }} | ${{ M: { k: { S: "v" } } }} | ${"gt"}
			${{ L: [{ S: "a" }] }}      | ${{ L: [{ S: "a" }] }}      | ${"gt"}
		`("$val1.$method($val2) throws", ({ val1, val2, method }) => {
			const value1 = plainToValue(val1);
			const value2 = plainToValue(val2);
			// @ts-expect-error ignore for test
			expect(() => value1[method](value2)).toThrow();
		});
	});

	describe("comparison throws for NULL values", () => {
		test.each`
			method
			${"lt"}
			${"gt"}
		`("NULL.$method(NULL) throws", ({ method }) => {
			const value1 = plainToValue({ NULL: true });
			const value2 = plainToValue({ NULL: true });
			// @ts-expect-error ignore for test
			expect(() => value1[method](value2)).toThrow(
				"Cannot compare NULL values",
			);
		});
	});

	describe("complex value comparisons", () => {
		test("nested map equality", () => {
			const val1 = plainToValue({
				M: {
					key1: { S: "val1" },
					key2: { M: { nested: { N: "123" } } },
				},
			});
			const val2 = plainToValue({
				M: {
					key1: { S: "val1" },
					key2: { M: { nested: { N: "123" } } },
				},
			});
			const val3 = plainToValue({
				M: {
					key1: { S: "val1" },
					key2: { M: { nested: { N: "456" } } },
				},
			});

			expect(val1.eq(val2)).toBe(true);
			expect(val1.eq(val3)).toBe(false);
		});

		test("list with mixed types equality", () => {
			const val1 = plainToValue({
				L: [
					{ S: "string" },
					{ N: "123" },
					{ BOOL: true },
					{ L: [{ S: "nested" }] },
				],
			});
			const val2 = plainToValue({
				L: [
					{ S: "string" },
					{ N: "123" },
					{ BOOL: true },
					{ L: [{ S: "nested" }] },
				],
			});
			const val3 = plainToValue({
				L: [
					{ S: "string" },
					{ N: "123" },
					{ BOOL: false },
					{ L: [{ S: "nested" }] },
				],
			});

			expect(val1.eq(val2)).toBe(true);
			expect(val1.eq(val3)).toBe(false);
		});
	});
});
