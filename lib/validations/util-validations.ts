import * as v from "valibot";

export const unique = v.check<string[]>(
	(input) => new Set(input).size === input.length,
);

export const atLeastOneItem = v.check<Record<string, string>>(
	(input) => Object.keys(input).length > 0,
);
