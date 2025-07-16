export type ValueType =
	| "S"
	| "N"
	| "B"
	| "SS"
	| "NS"
	| "BS"
	| "M"
	| "L"
	| "BOOL"
	| "NULL";

export interface Value {
	S?: string;
	N?: string;
	B?: string;
	SS?: string[];
	NS?: string[];
	BS?: string[];
	M?: Record<string, Value>;
	L?: Value[];
	NULL?: boolean;
	BOOL?: boolean;
	Value?: Value;
}
