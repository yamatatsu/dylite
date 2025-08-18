import { DynamoDB } from "@aws-sdk/client-dynamodb";

export const ddb = new DynamoDB({
	endpoint: process.env.MOCK_DYNAMODB_ENDPOINT ?? __TEST__.ddbEndpoint,
	region: "local-env",
	credentials: {
		accessKeyId: "fakeMyKeyId",
		secretAccessKey: "fakeSecretAccessKey",
	},
});
