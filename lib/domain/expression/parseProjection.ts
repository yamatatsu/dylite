import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { AstError } from "./ast/AstError";
import type { ProjectionExpression } from "./ast/ProjectionExpression";
import type { Context } from "./context";
import projectionParser from "./grammar-projection";

export function parseProjection(
	expression: string,
	options: {
		ExpressionAttributeNames: QueryCommandInput["ExpressionAttributeNames"];
	},
) {
	const context: Context = {
		attrNameMap: options.ExpressionAttributeNames ?? {},
		attrValMap: {},
	};

	const ast: ProjectionExpression = projectionParser.parse(expression, {
		context,
	});

	try {
		ast.validate();
	} catch (error) {
		if (error instanceof AstError) {
			return error.message;
		}
		throw error; // Re-throw unexpected errors
	}

	return ast;
}
