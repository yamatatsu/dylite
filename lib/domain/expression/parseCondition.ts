import type { PlainValue } from "../Value";
import { AstError } from "./ast/AstError";
import type { ConditionExpression } from "./ast/ConditionExpression";
import type { Context } from "./context";
import conditionParser from "./grammar-condition";

export function parseCondition(
	expression: string,
	options: {
		ExpressionAttributeNames: Record<string, string> | undefined;
		ExpressionAttributeValues: Record<string, PlainValue.Value> | undefined;
	},
) {
	const context: Context = {
		attrNameMap: options.ExpressionAttributeNames ?? {},
		attrValMap: options.ExpressionAttributeValues ?? {},
	};

	try {
		const ast = conditionParser.parse(expression, {
			context,
		}) as ConditionExpression;
		ast.validate();
		return ast;
	} catch (error) {
		if (error instanceof AstError) {
			return error.message;
		}
		throw error;
	}
}
