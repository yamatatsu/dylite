export function validateExpressionParams(
	data: Record<string, unknown>,
	expressions: string[],
	nonExpressions: string[],
) {
	const exprParams = expressions.filter((expr) => data[expr] != null);

	if (exprParams.length) {
		// Special case for KeyConditions and KeyConditionExpression
		if (data.KeyConditions != null && data.KeyConditionExpression == null) {
			nonExpressions.splice(nonExpressions.indexOf("KeyConditions"), 1);
		}
		const nonExprParams = nonExpressions.filter((expr) => data[expr] != null);
		if (nonExprParams.length) {
			return `Can not use both expression and non-expression parameters in the same request: Non-expression parameters: {${nonExprParams.join(", ")}} Expression parameters: {${exprParams.join(", ")}}`;
		}
	}

	if (data.ExpressionAttributeNames != null && !exprParams.length) {
		return "ExpressionAttributeNames can only be specified when using expressions";
	}

	const valExprs = expressions.filter(
		(expr) => expr !== "ProjectionExpression",
	);
	if (
		valExprs.length &&
		data.ExpressionAttributeValues != null &&
		valExprs.every((expr) => data[expr] == null)
	) {
		return `ExpressionAttributeValues can only be specified when using expressions: ${valExprs.join(" and ")} ${valExprs.length > 1 ? "are" : "is"} null`;
	}
}
