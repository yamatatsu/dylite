import { createKey } from "./createKey";

const sKeyItem = {
	p_key: { S: "p_key_val" },
	s_key: { S: "s_key_val" },
};
const bKeyItem = {
	p_key: { B: Buffer.from("p_key_val", "utf8") },
	s_key: { B: Buffer.from("s_key_val", "utf8") },
};
const nKeyItem = {
	p_key: { N: "123" },
	s_key: { N: "456" },
};

const sHashKeyDef = { AttributeName: "p_key", AttributeType: "S" } as const;
const bHashKeyDef = { AttributeName: "p_key", AttributeType: "B" } as const;
const nHashKeyDef = { AttributeName: "p_key", AttributeType: "N" } as const;

const sRangeKeyDef = { AttributeName: "s_key", AttributeType: "S" } as const;
const bRangeKeyDef = { AttributeName: "s_key", AttributeType: "B" } as const;
const nRangeKeyDef = { AttributeName: "s_key", AttributeType: "N" } as const;

const hashKeySchema = { AttributeName: "p_key", KeyType: "HASH" } as const;
const rangeKeySchema = { AttributeName: "s_key", KeyType: "RANGE" } as const;

test.each`
	item        | defs                           | keySchema                          | expected
	${sKeyItem} | ${[sHashKeyDef]}               | ${[hashKeySchema]}                 | ${"606a3d/705f6b65795f76616c/"}
	${sKeyItem} | ${[sHashKeyDef, sRangeKeyDef]} | ${[hashKeySchema, rangeKeySchema]} | ${"606a3d/705f6b65795f76616c/735f6b65795f76616c/"}
	${sKeyItem} | ${[sRangeKeyDef]}              | ${[rangeKeySchema]}                | ${"ba5d1a/735f6b65795f76616c/"}
	${bKeyItem} | ${[bHashKeyDef]}               | ${[hashKeySchema]}                 | ${"606a3d/705f6b65795f76616c/"}
	${bKeyItem} | ${[bHashKeyDef, bRangeKeyDef]} | ${[hashKeySchema, rangeKeySchema]} | ${"606a3d/705f6b65795f76616c/735f6b65795f76616c/"}
	${bKeyItem} | ${[bRangeKeyDef]}              | ${[rangeKeySchema]}                | ${"ba5d1a/735f6b65795f76616c/"}
	${nKeyItem} | ${[nHashKeyDef]}               | ${[hashKeySchema]}                 | ${"574207/184123/"}
	${nKeyItem} | ${[nHashKeyDef, nRangeKeyDef]} | ${[hashKeySchema, rangeKeySchema]} | ${"574207/184123/184456/"}
	${nKeyItem} | ${[nRangeKeyDef]}              | ${[rangeKeySchema]}                | ${"d4633d/184456/"}
`("$#", ({ item, defs, keySchema, expected }) => {
	expect(createKey(item, defs, keySchema)).toBe(expected);
});
