export class AstError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "AstError";
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
