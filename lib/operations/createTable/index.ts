import * as v from "valibot";
import type { Store } from "../../db/types";
import { TableDescription } from "../../domain/TableDescription";
import { action } from "./action";
import { schema } from "./schema";

export async function execute(json: unknown, store: Store) {
	new TableDescription(json);
	const res = v.safeParse(schema, json, { abortEarly: true });
	if (!res.success) {
		throw new Error(res.issues[0].message);
	}

	return action(store, res.output);
}
