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

	// Parse to AST
	const ast: UpdateExpression = updateParser.parse(expression, { context });

	// Process AST: resolve aliases and validate
	const errors: Record<string, string> = {};

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
	const overlappedPath = ast.findOverlappedPath();
	if (overlappedPath) {
		return `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${overlappedPath[0]}, path two: ${overlappedPath[1]}`;
	}
	const pathConflict = ast.findPathConflict();
	if (pathConflict) {
		return `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${pathConflict[0]}, path two: ${pathConflict[1]}`;
	}
	const incorrectOperandAction = ast.findIncorrectOperandAction();
	if (incorrectOperandAction) {
		const resolved = incorrectOperandAction.value.value();
		if (resolved) {
			const typeMappings: Record<string, string> = {
				S: "STRING",
				N: "NUMBER",
				B: "BINARY",
				SS: "STRING SET",
				NS: "NUMBER SET",
				BS: "BINARY SET",
				M: "MAP",
				L: "LIST",
				NULL: "NULL",
				BOOL: "BOOLEAN",
			};
			const operandTypeString = typeMappings[resolved.type] || resolved.type;
			const operator =
				incorrectOperandAction.type === "AddAction" ? "ADD" : "DELETE";
			return `Incorrect operand type for operator or function; operator: ${operator}, operand type: ${operandTypeString}`;
		}
	}
	const incorrectOperandArithmetic = ast.findIncorrectOperandArithmetic();
	if (incorrectOperandArithmetic) {
		const operand = incorrectOperandArithmetic.getIncorrectOperand();
		const type =
			operand &&
			("valueType" in operand ? operand.valueType() : operand.value()?.type);
		return `Incorrect operand type for operator or function; operator or function: ${incorrectOperandArithmetic.operator}, operand type: ${type}`;
	}
	try {
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
