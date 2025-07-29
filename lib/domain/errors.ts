export function validationException(msg: string) {
	const err = new Error(msg);
	err.name = "com.amazon.coral.validate#ValidationException";
	return err;
}
