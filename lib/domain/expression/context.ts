import type { Value } from "../types";

export type Context = {
	attrNameMap: Record<string, string>;
	attrValMap: Record<string, Value>;
};
