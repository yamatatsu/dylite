import * as v from "valibot";
import type { Store } from "../../db/types";
import { action } from "./action";
import { schema } from "./schema";

export async function execute(json: unknown, store: Store) {
	const res = v.safeParse(schema, json, { abortEarly: true });
	if (!res.success) {
		return res.issues[0].message;
	}

	return action(store, res.output);
}
