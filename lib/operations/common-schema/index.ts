import * as v from "valibot";

export const tableNameSchema = v.pipe(
	v.string(),
	v.regex(/^[a-zA-Z0-9_.-]+$/),
	v.minLength(3),
	v.maxLength(255),
);
