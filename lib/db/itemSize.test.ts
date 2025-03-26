import { itemSize } from "./itemSize";

test.each`
	item                                                             | compress | addMetaSize | rangeKey     | expected
	${{}}                                                            | ${false} | ${false}    | ${undefined} | ${0}
	${{}}                                                            | ${true}  | ${false}    | ${undefined} | ${0}
	${{}}                                                            | ${false} | ${true}     | ${undefined} | ${20}
	${{}}                                                            | ${true}  | ${true}     | ${undefined} | ${20}
	${{ p_key: { S: "p_val" } }}                                     | ${false} | ${false}    | ${undefined} | ${10}
	${{ p_key: { S: "p_val" } }}                                     | ${true}  | ${false}    | ${undefined} | ${7}
	${{ p_key: { S: "p_val" } }}                                     | ${false} | ${true}     | ${undefined} | ${30}
	${{ p_key: { S: "p_val" } }}                                     | ${true}  | ${true}     | ${undefined} | ${27}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${false} | ${false}    | ${undefined} | ${20}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${true}  | ${false}    | ${undefined} | ${14}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${false} | ${true}     | ${undefined} | ${40}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${true}  | ${true}     | ${undefined} | ${34}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${false} | ${false}    | ${"s_key"}   | ${20}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${true}  | ${false}    | ${"s_key"}   | ${7}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${false} | ${true}     | ${"s_key"}   | ${40}
	${{ p_key: { S: "p_val" }, s_key: { S: "s_val" } }}              | ${true}  | ${true}     | ${"s_key"}   | ${32}
	${{ foo: { S: "bar" } }}                                         | ${false} | ${false}    | ${undefined} | ${6}
	${{ foo: { S: "bar" } }}                                         | ${true}  | ${false}    | ${undefined} | ${5}
	${{ foo: { B: base64("bar") } }}                                 | ${false} | ${false}    | ${undefined} | ${6}
	${{ foo: { B: base64("bar") } }}                                 | ${true}  | ${false}    | ${undefined} | ${5}
	${{ foo: { N: "1234" } }}                                        | ${false} | ${false}    | ${undefined} | ${6}
	${{ foo: { N: "1234" } }}                                        | ${true}  | ${false}    | ${undefined} | ${5}
	${{ foo: { SS: ["bar", "buz"] } }}                               | ${false} | ${false}    | ${undefined} | ${9}
	${{ foo: { SS: ["bar", "buz"] } }}                               | ${true}  | ${false}    | ${undefined} | ${10}
	${{ foo: { BS: [base64("bar"), base64("buz")] } }}               | ${false} | ${false}    | ${undefined} | ${9}
	${{ foo: { BS: [base64("bar"), base64("buz")] } }}               | ${true}  | ${false}    | ${undefined} | ${10}
	${{ foo: { NS: ["1234", "5678"] } }}                             | ${false} | ${false}    | ${undefined} | ${9}
	${{ foo: { NS: ["1234", "5678"] } }}                             | ${true}  | ${false}    | ${undefined} | ${10}
	${{ foo: { NULL: true } }}                                       | ${false} | ${false}    | ${undefined} | ${4}
	${{ foo: { NULL: true } }}                                       | ${true}  | ${false}    | ${undefined} | ${1}
	${{ foo: { BOOL: false } }}                                      | ${false} | ${false}    | ${undefined} | ${4}
	${{ foo: { BOOL: false } }}                                      | ${true}  | ${false}    | ${undefined} | ${2}
	${{ foo: { L: [{ S: "bar" }, { N: "1234" }] } }}                 | ${false} | ${false}    | ${undefined} | ${14}
	${{ foo: { L: [{ S: "bar" }, { N: "1234" }] } }}                 | ${true}  | ${false}    | ${undefined} | ${14}
	${{ foo: { M: { bar: { S: "bar_val" }, buz: { N: "1234" } } } }} | ${false} | ${false}    | ${undefined} | ${24}
	${{ foo: { M: { bar: { S: "bar_val" }, buz: { N: "1234" } } } }} | ${true}  | ${false}    | ${undefined} | ${20}
`("$#", ({ item, compress, addMetaSize, rangeKey, expected }) => {
	const size = itemSize(item, compress, addMetaSize, rangeKey);
	expect(size).toBe(expected);
});

// test helper

function base64(str: string) {
	return Buffer.from(str).toString("base64");
}
