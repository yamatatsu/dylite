import type { Value } from "../types";
import { AstError } from "./ast/AstError";
import type { UpdateExpression } from "./ast/UpdateExpression";
import type { Context } from "./context";
import updateParser from "./grammar-update";

export function parseUpdate(
	expression: string,
	options: {
		ExpressionAttributeNames: Record<string, string> | undefined;
		ExpressionAttributeValues: Record<string, Value> | undefined;
	},
) {
	const context: Context = {
		attrNameMap: options.ExpressionAttributeNames ?? {},
		attrValMap: options.ExpressionAttributeValues ?? {},
	};

	const ast: UpdateExpression = updateParser.parse(expression, { context });

	try {
		ast.traverse((node) => {
			if (node.type === "PathExpression") {
				node.assertReservedKeyword();
			}
		});
		ast.traverse((node) => {
			if (node.type === "FunctionCall") {
				node.assertUnknownFunction();
			}
		});
		ast.assertDuplicateSection();
		ast.traverse((node) => {
			if (node.type === "PathExpression") {
				node.assertResolvable();
			}
		});
		ast.traverse((node) => {
			if (node.type === "AttributeValue") {
				node.assertResolvable();
			}
		});
		ast.assertOverlappedPath();
		ast.assertPathConflict();
		ast.traverse((node) => {
			if (node.type === "AddAction" || node.type === "DeleteAction")
				node.assertOperandType();
		});
		ast.traverse((node) => {
			if (node.type === "ArithmeticExpression") node.assertValidUsage();
		});
		ast.traverse((node) => {
			if (node.type === "FunctionCall") node.assertValidUsage();
		});
	} catch (error) {
		if (error instanceof AstError) {
			return error.message;
		}
		throw error; // Re-throw unexpected errors
	}

	return ast;
}
