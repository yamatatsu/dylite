import * as v from "valibot";
import { tableNameSchema } from "../common-schema";

export const schema = v.object({
	TableName: tableNameSchema,
});

export type Schema = v.InferOutput<typeof schema>;
