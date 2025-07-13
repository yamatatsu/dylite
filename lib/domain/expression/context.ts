import type { AttributeValue } from "../types";

export type Context = {
	attrNameMap: Record<string, string>;
	attrValMap: Record<string, AttributeValue>;
};
