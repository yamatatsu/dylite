import { addConsumedCapacity } from "./addConsumedCapacity";

test.each`
	ReturnConsumedCapacity | newItem                                | oldItem                                | expected
	${null}                | ${null}                                | ${null}                                | ${undefined}
	${"NONE"}              | ${null}                                | ${null}                                | ${undefined}
	${"TOTAL"}             | ${null}                                | ${null}                                | ${{ TableName: "test-table", CapacityUnits: 1 }}
	${"TOTAL"}             | ${{ foo: { S: "a".repeat(2 ** 15) } }} | ${null}                                | ${{ TableName: "test-table", CapacityUnits: 33 }}
	${"TOTAL"}             | ${{ foo: { S: "a".repeat(2 ** 15) } }} | ${{ foo: { S: "a".repeat(2 ** 16) } }} | ${{ TableName: "test-table", CapacityUnits: 65 }}
	${"INDEXES"}           | ${{ foo: { S: "a".repeat(2 ** 15) } }} | ${null}                                | ${{ TableName: "test-table", CapacityUnits: 33, Table: { CapacityUnits: 33 } }}
`("$#", ({ ReturnConsumedCapacity, newItem, oldItem, expected }) => {
	const actual = addConsumedCapacity(
		{ TableName: "test-table", ReturnConsumedCapacity },
		false,
		newItem,
		oldItem,
	);

	expect(actual).toEqual(expected);
});
