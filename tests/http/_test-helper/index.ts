export { ddb } from "./ddb";
export * as PkTable from "./pk-table";
export * as PkSkTable from "./pk-sk-table";
export * from "./utils";
export { Faker } from "./faker";

export const expectUuid = expect.stringMatching(
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);
