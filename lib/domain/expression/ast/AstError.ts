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
