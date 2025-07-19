import { PkTable, ddb, toUint8Array } from "./_test-helper";

describe.skip("Update Expressions", () => {
	let tableName: string;
	const item = PkTable.getItem1();

	beforeEach(async () => {
		const table = await PkTable.create();
		tableName = table.tableName;
		await ddb.putItem({
			TableName: tableName,
			Item: item,
		});
	});

	describe("SET Action", () => {
		test("use a function as an operand of '+' operator", async () => {
			// WHEN
			const res = await ddb.updateItem({
				TableName: tableName,
				Key: { pk: item.pk },
				UpdateExpression:
					"SET key_N = key_N + if_not_exists(key_not_exists, :n)",
				ExpressionAttributeValues: { ":n": { N: "1" } },
				ReturnValues: "ALL_NEW",
			});

			// THEN
			expect(res.Attributes?.key_N).toEqual({ N: "124" });
			expect(res.$metadata.httpStatusCode).toBe(200);
		});
	});

	describe("ADD Action", () => {
		test("success", async () => {
			// WHEN
			const res = await ddb.updateItem({
				TableName: tableName,
				Key: { pk: item.pk },
				UpdateExpression: "ADD key_N :n, key_SS :ss, key_NS :ns, key_BS :bs",
				ExpressionAttributeValues: {
					":n": { N: "1" },
					":ss": { SS: ["c"] },
					":ns": { NS: ["3"] },
					":bs": { BS: [toUint8Array("z")] },
				},
				ReturnValues: "ALL_NEW",
			});

			// THEN
			expect(res.Attributes?.key_N).toEqual({ N: "124" });
			expect(res.Attributes?.key_SS).toEqual({ SS: ["a", "b", "c"] });
			expect(res.Attributes?.key_NS).toEqual({ NS: ["1", "2", "3"] });
			expect(res.Attributes?.key_BS).toEqual({
				BS: [toUint8Array("x"), toUint8Array("y"), toUint8Array("z")],
			});
			expect(res.$metadata.httpStatusCode).toBe(200);
		});

		test.each`
			values                                | message_part
			${{ ":s": { S: "c" } }}               | ${"STRING"}
			${{ ":s": { B: toUint8Array("c") } }} | ${"BINARY"}
		`(
			"failure when adding a $message_part",
			async ({ values, message_part }) => {
				// WHEN
				const promise = ddb.updateItem({
					TableName: tableName,
					Key: { pk: item.pk },
					UpdateExpression: "ADD key_S :s",
					ExpressionAttributeValues: values,
					ReturnValues: "ALL_NEW",
				});

				// THEN
				await expect(promise).rejects.toThrow(
					`Invalid UpdateExpression: Incorrect operand type for operator or function; operator: ADD, operand type: ${message_part}, typeSet: ALLOWED_FOR_ADD_OPERAND`,
				);
			},
		);
	});
});
