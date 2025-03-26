import { capacityUnits } from "./capacityUnits";

test.each`
	item                                   | isRead   | isConsistent | expected
	${null}                                | ${false} | ${false}     | ${1}
	${null}                                | ${true}  | ${false}     | ${0.5}
	${null}                                | ${false} | ${true}      | ${1}
	${null}                                | ${true}  | ${true}      | ${1}
	${{}}                                  | ${false} | ${false}     | ${0}
	${{}}                                  | ${true}  | ${false}     | ${0}
	${{}}                                  | ${false} | ${true}      | ${0}
	${{}}                                  | ${true}  | ${true}      | ${0}
	${{ foo: { S: "a".repeat(2 ** 16) } }} | ${false} | ${false}     | ${65}
	${{ foo: { S: "a".repeat(2 ** 16) } }} | ${true}  | ${false}     | ${8.5}
	${{ foo: { S: "a".repeat(2 ** 16) } }} | ${false} | ${true}      | ${65}
	${{ foo: { S: "a".repeat(2 ** 16) } }} | ${true}  | ${true}      | ${17}
`("$#", ({ item, isRead, isConsistent, expected }) => {
	const actual = capacityUnits(item, isRead, isConsistent);
	expect(actual).toBe(expected);
});
