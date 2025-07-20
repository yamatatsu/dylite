import type { Value } from "../types";
import type { AttributeValue } from "./ast/AttributeValue";
import { FunctionForUpdate } from "./ast/FunctionForUpdate";
import { PathExpression } from "./ast/PathExpression";
import type { Operand } from "./ast/SetAction";
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

	for (const section of ast.sections) {
		for (const expr of section.expressions) {
			switch (expr.type) {
				case "SetAction": {
					resolveOperand(expr.value, errors);
					break;
				}
			}

			if (hasError(errors)) break;
		}

		if (hasError(errors)) break;
	}

	// Check for errors
	const error = checkErrors(errors);
	if (error) return error;

	return ast;
}

function resolveOperand(
	operand: Operand,
	errors: Record<string, string>,
): void {
	if (operand.type === "FunctionCall") {
		for (const arg of operand.args) {
			resolveOperand(arg, errors);
			if (hasError(errors)) return;
		}

		checkFunction(operand.name, operand.args, errors);
	}
}

function checkFunction(
	name: string,
	args: (PathExpression | AttributeValue | FunctionForUpdate)[],
	errors: Record<string, string>,
): void {
	if (errors.function) {
		return;
	}

	const functions: Record<string, number> = {
		if_not_exists: 2,
		list_append: 2,
	};

	const numOperands = functions[name];
	if (numOperands !== args.length) {
		errors.function = `Incorrect number of operands for operator or function; operator or function: ${name}, number of operands: ${args.length}`;
		return;
	}

	switch (name) {
		case "if_not_exists":
			if (
				!args[0] ||
				typeof args[0] !== "object" ||
				!("type" in args[0]) ||
				args[0].type !== "PathExpression"
			) {
				errors.function = `Operator or function requires a document path; operator or function: ${name}`;
			}
			return;
		case "list_append":
			for (let i = 0; i < args.length; i++) {
				const type = getType(args[i]);
				if (type && type !== "L") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return;
				}
			}
			return;
	}
}

function getType(
	val: PathExpression | AttributeValue | FunctionForUpdate,
): string | null {
	if (val instanceof PathExpression) return null;
	if (val instanceof FunctionForUpdate) return val.valueType();
	return val.value()?.type ?? null;
}

function checkErrors(errors: Record<string, string>): string | null {
	const errorOrder = ["function"];
	for (let i = 0; i < errorOrder.length; i++) {
		if (errors[errorOrder[i]]) return errors[errorOrder[i]];
	}
	return null;
}

function hasError(errors: Record<string, string>): boolean {
	return Object.keys(errors).length > 0;
}
