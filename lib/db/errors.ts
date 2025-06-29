export function validationException(msg: string) {
	const err = new Error(msg);
	err.name = "com.amazon.coral.validate#ValidationException";
	return err;
}

/**
 * @deprecated Use validationException instead
 */
export function validationError(msg: string): Error {
	const err = new Error(msg);
	err.name = "ValidationException";
	return err;
}

export function conditionalError(
	msg = "The conditional request failed",
): Error {
	const err = new Error(msg);
	err.name = "ConditionalCheckFailedException";
	return err;
}

export function limitError(msg: string): Error {
	const err = new Error(msg);
	err.name = "LimitExceededException";
	return err;
}
