interface DynamoDBError extends Error {
	statusCode?: number;
	body?: {
		__type: string;
		message: string;
	};
}

export function notFoundError(checkStatus: boolean): DynamoDBError {
	const error = new Error("NotFoundError") as DynamoDBError;
	error.name = "NotFoundError";
	error.statusCode = 400;
	error.body = {
		__type: "com.amazonaws.dynamodb.v20120810#ResourceNotFoundException",
		message: "Requested resource not found",
	};
	if (!checkStatus) error.body.message += `: Table: ${name} not found`;
	return error;
}

export function validationError(msg: string): DynamoDBError {
	const err = new Error(msg) as DynamoDBError;
	err.statusCode = 400;
	err.body = {
		__type: "com.amazon.coral.validate#ValidationException",
		message: msg,
	};
	return err;
}

export function conditionalError(
	msg = "The conditional request failed",
): DynamoDBError {
	const err = new Error(msg) as DynamoDBError;
	err.statusCode = 400;
	err.body = {
		__type: "com.amazonaws.dynamodb.v20120810#ConditionalCheckFailedException",
		message: msg,
	};
	return err;
}

export function limitError(msg: string): DynamoDBError {
	const err = new Error(msg) as DynamoDBError;
	err.statusCode = 400;
	err.body = {
		__type: "com.amazonaws.dynamodb.v20120810#LimitExceededException",
		message: msg,
	};
	return err;
}
