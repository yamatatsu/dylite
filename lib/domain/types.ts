export type AttributeType =
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

export interface AttributeValue {
	S?: string;
	N?: string;
	B?: string;
	SS?: string[];
	NS?: string[];
	BS?: string[];
	M?: Record<string, AttributeValue>;
	L?: AttributeValue[];
	NULL?: boolean;
	BOOL?: boolean;
	Value?: AttributeValue;
}
