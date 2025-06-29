import * as v from "valibot";
import { tableNameSchema } from "../common";

export const schema = v.object({
	TableName: tableNameSchema("TableName"),
});

export type Schema = v.InferOutput<typeof schema>;
