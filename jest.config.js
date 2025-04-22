/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
	testEnvironment: "node",
	projects: [
		{
			displayName: "unit",
			transform: { "^.+.tsx?$": ["ts-jest", {}] },
			testMatch: ["<rootDir>/lib/**/*.test.ts"],
		},
		{
			displayName: "dynamodb-local",
			transform: { "^.+.tsx?$": ["ts-jest", {}] },
			testMatch: ["<rootDir>/tests/http/**/*.test.ts"],
			preset: "@shelf/jest-dynamodb",
		},
	],
};
