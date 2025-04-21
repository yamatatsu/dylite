import * as v from "valibot";
import { tableNameSchema } from "../common-schema";

export const schema = v.object({
	Limit: v.optional(
		v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
	),
	ExclusiveStartTableName: v.optional(
		tableNameSchema("ExclusiveStartTableName"),
	),
});

export type Schema = v.InferOutput<typeof schema>;
