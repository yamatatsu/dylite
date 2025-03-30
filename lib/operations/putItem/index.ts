import * as v from "valibot";
import type { Store } from "../../db/types";
import { custom, schema } from "./schema";

export async function execute(json: unknown, store: Store) {
	const res = v.safeParse(schema, json);
	if (!res.success) {
		return res.issues[0].message;
	}

	const msg = custom(res.output, store);
	if (msg) return msg;

	return "Hello Hono!";
}
