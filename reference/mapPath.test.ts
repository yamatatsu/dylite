import { mapPath } from "./mapPath";

const item = {
	foo: { S: "a" },
	bar: { L: [{ S: "b" }, { S: "c" }] },
	baz: { M: { baz1: { S: "d" }, baz2: { S: "e" } } },
	qux: {
		M: {
			qux1: { L: [{ S: "f" }, { S: "g" }] },
			qux2: { L: [{ S: "h" }, { S: "i" }] },
		},
	},
};

test.each`
	path                  | expected
	${["x"]}              | ${null}
	${["foo"]}            | ${{ S: "a" }}
	${["bar"]}            | ${{ L: [{ S: "b" }, { S: "c" }] }}
	${["bar", 0]}         | ${{ S: "b" }}
	${["baz"]}            | ${{ M: { baz1: { S: "d" }, baz2: { S: "e" } } }}
	${["baz", "baz2"]}    | ${{ S: "e" }}
	${["qux", "qux1", 1]} | ${{ S: "g" }}
`("$#", ({ path, expected }) => {
	const result = mapPath(path, item);
	expect(result).toEqual(expected);
});
