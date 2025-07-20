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

	const reservedWord = ast.findReservedWord();
	if (reservedWord) {
		return `Attribute name is a reserved keyword; reserved keyword: ${reservedWord}`;
	}
	const unknownFunction = ast.findUnknownFunction();
	if (unknownFunction) {
		return `Invalid function name; function: ${unknownFunction}`;
	}
	const duplicateSection = ast.findDuplicateSection();
	if (duplicateSection) {
		return `The "${duplicateSection}" section can only be used once in an update expression;`;
	}
	const unresolvableName = ast.findUnresolvableName();
	if (unresolvableName) {
		return `An expression attribute name used in the document path is not defined; attribute name: ${unresolvableName}`;
	}
	const unresolvableValue = ast.findUnresolvableValue();
	if (unresolvableValue) {
		return `An expression attribute value used in expression is not defined; attribute value: ${unresolvableValue}`;
	}

	try {
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
