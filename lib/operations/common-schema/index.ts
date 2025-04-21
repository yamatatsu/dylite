import * as v from "valibot";

export const tableNameSchema = (keyName: string) =>
	v.pipe(
		v.string(),
		v.regex(/^[a-zA-Z0-9_.-]+$/),
		v.minLength(
			3,
			`${keyName} must be at least 3 characters long and at most 255 characters long`,
		),
		v.maxLength(
			255,
			`${keyName} must be at least 3 characters long and at most 255 characters long`,
		),
	);
