import { DynamoDB } from "@aws-sdk/client-dynamodb";

export const expectUuid = expect.stringMatching(
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);

export const ddb = new DynamoDB({
	endpoint: process.env.MOCK_DYNAMODB_ENDPOINT ?? __TEST__.ddbEndpoint,
	region: "local-env",
	credentials: {
		accessKeyId: "fakeMyKeyId",
		secretAccessKey: "fakeSecretAccessKey",
	},
});
