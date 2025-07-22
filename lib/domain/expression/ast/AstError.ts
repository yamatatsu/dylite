import type { Value } from "../../Value";

export class AstError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AstError";
	}
}

export class ReservedKeywordError extends AstError {
	public readonly name = "ReservedKeywordError";
	constructor(keyword: string) {
		super(`Attribute name is a reserved keyword; reserved keyword: ${keyword}`);
	}
}

export class UnknownFunctionError extends AstError {
	public readonly name = "UnknownFunctionError";
	constructor(functionName: string) {
		super(`Invalid function name; function: ${functionName}`);
	}
}

export class DuplicateSectionError extends AstError {
	public readonly name = "DuplicateSectionError";
	constructor(section: string) {
		super(
			`The "${section}" section can only be used once in an update expression;`,
		);
	}
}

export class UnresolvableAttributeNameError extends AstError {
	public readonly name = "UnresolvableAttributeNameError";
	constructor(alias: string) {
		super(
			`An expression attribute name used in the document path is not defined; attribute name: ${alias}`,
		);
	}
}

export class UnresolvableAttributeValueError extends AstError {
	public readonly name = "UnresolvableAttributeValueError";
	constructor(alias: string) {
		super(
			`An expression attribute value used in expression is not defined; attribute value: ${alias}`,
		);
	}
}

export class NumberOfOperandsError extends AstError {
	public readonly name = "NumberOfOperandsError";
	constructor(name: string, num: number) {
		super(
			`Incorrect number of operands for operator or function; operator or function: ${name}, number of operands: ${num}`,
		);
	}
}

export class DocumentPathRequiredError extends AstError {
	public readonly name = "DocumentPathRequiredError";
	constructor(name: string) {
		super(
			`Invalid UpdateExpression: Operator or function requires a document path; operator or function: ${name}`,
		);
	}
}

export class IncorrectOperandTypeError extends AstError {
	public readonly name = "IncorrectOperandTypeError";
	constructor(name: string, type: string) {
		super(
			`Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`,
		);
	}
}

export class IncorrectActionOperandTypeError extends AstError {
	public readonly name = "IncorrectActionOperandTypeError";
	constructor(label: string, type: string) {
		const typeMappings: Record<string, string> = {
			S: "STRING",
			N: "NUMBER",
			B: "BINARY",
			SS: "STRING SET",
			NS: "NUMBER SET",
			BS: "BINARY SET",
			M: "MAP",
			L: "LIST",
			NULL: "NULL",
			BOOL: "BOOLEAN",
		};

		super(
			`Invalid UpdateExpression: Incorrect operand type for operator or function; operator: ${label}, operand type: ${typeMappings[type]}, typeSet: ALLOWED_FOR_${label}_OPERAND`,
		);
	}
}

export class OverlappedPathError extends AstError {
	public readonly name = "OverlappedPathError";
	constructor(path1: string, path2: string) {
		super(
			`Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${path1}, path two: ${path2}`,
		);
	}
}

export class PathConflictError extends AstError {
	public readonly name = "PathConflictError";
	constructor(path1: string, path2: string) {
		super(
			`Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${path1}, path two: ${path2}`,
		);
	}
}

export class RedundantParensError extends AstError {
	public readonly name = "RedundantParensError";
	constructor() {
		super("The expression has redundant parentheses;");
	}
}

export class MisusedFunctionError extends AstError {
	public readonly name = "MisusedFunctionError";
	constructor(functionName: string) {
		super(
			`The function is not allowed to be used this way in an expression; function: ${functionName}`,
		);
	}
}

export class DistinctOperandsError extends AstError {
	public readonly name = "DistinctOperandsError";
	constructor(operator: string, operand: string) {
		super(
			`The first operand must be distinct from the remaining operands for this operator or function; operator: ${operator}, first operand: ${operand}`,
		);
	}
}

export class InvalidAttributeTypeError extends AstError {
	public readonly name = "InvalidAttributeTypeError";
	constructor(type: string) {
		super(
			`Invalid attribute type name found; type: ${type}, valid types: {B,NULL,SS,BOOL,L,BS,N,NS,S,M}`,
		);
	}
}

export class BetweenBoundsError extends AstError {
	public readonly name = "BetweenBoundsError";
	constructor(value1: Value, value2: Value) {
		super(
			`The BETWEEN operator requires upper bound to be greater than or equal to lower bound; lower bound operand: AttributeValue: {${value1.type}:${value1.value}}, upper bound operand: AttributeValue: {${value2.type}:${value2.value}}`,
		);
	}
}

export class BetweenOperandTypeError extends AstError {
	public readonly name = "BetweenOperandTypeError";
	constructor(value1: Value, value2: Value) {
		super(
			`The BETWEEN operator requires same data type for lower and upper bounds; lower bound operand: AttributeValue: {${value1.type}:${value1.value}}, upper bound operand: AttributeValue: {${value2.type}:${value2.value}}`,
		);
	}
}
