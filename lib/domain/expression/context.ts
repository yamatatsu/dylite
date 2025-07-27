import type { PlainValue } from "../Value";

export type Context = {
	attrNameMap: Record<string, string>;
	attrValMap: Record<string, PlainValue.Value>;
};
