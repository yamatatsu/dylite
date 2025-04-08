import request from "supertest";

const post = request("http://localhost:4567")
	.post("/")
	.set("x-amz-target", "DynamoDB_20120810.CreateTable");

test("missing Authentication Token", async () => {
	const actual = await post.send({
		TableName: "test-table",
		AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
		ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
	});
	expect(actual.status).toBe(400);
	expect(actual.body).toEqual({
		__type: "com.amazon.coral.service#MissingAuthenticationTokenException",
		message: "Request is missing Authentication Token",
	});
});

test.skip("happy path", async () => {
	const actual = await post.send({
		TableName: "test-table",
		AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
		KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
		ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
	});
	expect(actual.status).toBe(200);
	expect(actual.body).toEqual({
		TableDescription: {
			TableName: "test-table",
			TableId: expect.stringMatching(
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
			),
			TableArn: "arn:aws:dynamodb:us-east-1:000000000000:table/test-table",
			AttributeDefinitions: [
				{
					AttributeName: "id",
					AttributeType: "S",
				},
			],
			BillingModeSummary: {
				BillingMode: "PAY_PER_REQUEST",
			},
			CreationDateTime: expect.any(Number),
			ItemCount: 0,
			KeySchema: [
				{
					AttributeName: "id",
					KeyType: "HASH",
				},
			],
			ProvisionedThroughput: {
				NumberOfDecreasesToday: 0,
				ReadCapacityUnits: 5,
				WriteCapacityUnits: 5,
			},
			TableSizeBytes: 0,
			TableStatus: "CREATING",
			TableThroughputModeSummary: {
				TableThroughputMode: "PAY_PER_REQUEST",
			},
		},
	});
});
