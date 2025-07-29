export function validationException(msg: string) {
	const err = new Error(msg);
	err.name = "com.amazon.coral.validate#ValidationException";
	return err;
}

export function resourceInUseException(msg: string) {
	const err = new Error(msg);
	err.name = "com.amazonaws.dynamodb.v20120810#ResourceInUseException";
	return err;
}
