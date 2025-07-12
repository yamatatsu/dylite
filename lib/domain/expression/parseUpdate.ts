import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import isReserved from "./isReserved";
import updateParser from "./update-grammar";

type PathSegment =
	| { type: "Identifier"; name: string }
	| { type: "Alias"; name: string }
	| { type: "ArrayIndex"; index: number };

type PathExpression = {
	type: "PathExpression";
	segments: PathSegment[];
};

type Value = { type: "AttributeValue"; name: string } | Record<string, unknown>; // DynamoDB attribute values after resolution

type Operand = PathExpression | Value | FunctionCall | ArithmeticExpression;

type FunctionCall = {
	type: "FunctionCall";
	name: string;
	args: Operand[];
};

type ArithmeticExpression = {
	type: "ArithmeticExpression";
	operator: "+" | "-";
	left: Operand;
	right: Operand;
};

type SetExpression = {
	type: "SetExpression";
	path: PathExpression;
	value: Operand;
};

type RemoveExpression = {
	type: "RemoveExpression";
	path: PathExpression;
};

type AddExpression = {
	type: "AddExpression";
	path: PathExpression;
	value: Value;
};

type DeleteExpression = {
	type: "DeleteExpression";
	path: PathExpression;
	value: Value;
};

type Section = {
	type: "SET" | "REMOVE" | "ADD" | "DELETE";
	expressions: (
		| SetExpression
		| RemoveExpression
		| AddExpression
		| DeleteExpression
	)[];
};

type UpdateExpressionAST = {
	type: "UpdateExpression";
	sections: Section[];
};

export function parseUpdate(
	expression: string,
	options: {
		ExpressionAttributeNames: QueryCommandInput["ExpressionAttributeNames"];
		ExpressionAttributeValues: QueryCommandInput["ExpressionAttributeValues"];
	},
) {
	const context = {
		attrNames: options.ExpressionAttributeNames,
		attrVals: options.ExpressionAttributeValues,
	};

	// Parse to AST
	const ast: UpdateExpressionAST = updateParser.parse(expression);

	// Process AST: resolve aliases and validate
	const errors: Record<string, string> = {};
	const sections: Record<string, boolean> = {};
	const paths: (string | number)[][] = [];
	const nestedPaths: Record<string, boolean> = {};
	const processedSections: unknown[] = [];

	for (const section of ast.sections) {
		// Check for duplicate sections
		if (sections[section.type]) {
			errors.section = `The "${section.type}" section can only be used once in an update expression;`;
			break;
		}
		sections[section.type] = true;

		const processedExpressions: unknown[] = [];

		for (const expr of section.expressions) {
			let processedExpr: unknown;

			// Process path and check for errors
			const resolvedPath = resolvePath(expr.path, context, errors);
			if (errors.attrName || errors.reserved) break;

			// Check path conflicts
			checkPath(resolvedPath, paths, errors);
			if (errors.pathOverlap || errors.pathConflict) break;

			switch (expr.type) {
				case "SetExpression": {
					const resolvedValue = resolveOperand(expr.value, context, errors);
					if (hasError(errors)) break;

					const attrType = getType(resolvedValue);
					processedExpr = {
						type: "set",
						path: resolvedPath,
						val: resolvedValue,
						attrType: attrType,
					};
					break;
				}
				case "RemoveExpression": {
					processedExpr = {
						type: "remove",
						path: resolvedPath,
					};
					break;
				}
				case "AddExpression": {
					const resolvedValue = resolveValue(expr.value, context, errors);
					if (errors.attrVal) break;

					const attrType = checkOperator("ADD", resolvedValue, errors);
					if (hasError(errors)) break;

					processedExpr = {
						type: "add",
						path: resolvedPath,
						val: resolvedValue,
						attrType: attrType,
					};
					break;
				}
				case "DeleteExpression": {
					const resolvedValue = resolveValue(expr.value, context, errors);
					if (errors.attrVal) break;

					const attrType = checkOperator("DELETE", resolvedValue, errors);
					if (hasError(errors)) break;

					processedExpr = {
						type: "delete",
						path: resolvedPath,
						val: resolvedValue,
						attrType: attrType,
					};
					break;
				}
			}

			if (hasError(errors)) break;
			processedExpressions.push(processedExpr);
		}

		if (hasError(errors)) break;
		processedSections.push(...processedExpressions);
	}

	// Check for errors
	const error = checkErrors(errors);
	if (error) return error;

	return {
		sections: processedSections,
		paths: paths,
		nestedPaths: nestedPaths,
	};
}

type Context = {
	attrNames?: Record<string, string>;
	attrVals?: Record<string, unknown>;
	nestedPaths?: Record<string, boolean>;
};

function resolvePath(
	path: PathExpression,
	context: Context,
	errors: Record<string, string>,
): (string | number)[] {
	const resolvedSegments: (string | number)[] = [];

	for (let i = 0; i < path.segments.length; i++) {
		const segment = path.segments[i];

		if (segment.type === "Identifier") {
			checkReserved(segment.name, isReserved, errors);
			if (errors.reserved) return [];
			resolvedSegments.push(segment.name);
		} else if (segment.type === "Alias") {
			const resolved = resolveAttrName(segment.name, context, errors);
			if (errors.attrName || resolved === null) return [];
			resolvedSegments.push(resolved);
		} else if (segment.type === "ArrayIndex") {
			resolvedSegments.push(segment.index);
		}
	}

	if (resolvedSegments.length > 1) {
		context.nestedPaths = context.nestedPaths || {};
		context.nestedPaths[resolvedSegments[0]] = true;
	}

	return resolvedSegments;
}

function resolveOperand(
	operand: Operand,
	context: Context,
	errors: Record<string, string>,
): unknown {
	if (operand.type === "PathExpression") {
		return resolvePath(operand as PathExpression, context, errors);
	}
	if (operand.type === "AttributeValue") {
		return resolveValue(operand as Value, context, errors);
	}
	if (operand.type === "FunctionCall") {
		return resolveFunction(operand as FunctionCall, context, errors);
	}
	if (operand.type === "ArithmeticExpression") {
		const arithExpr = operand as ArithmeticExpression;
		const left = resolveOperand(arithExpr.left, context, errors);
		if (hasError(errors)) return null;

		const right = resolveOperand(arithExpr.right, context, errors);
		if (hasError(errors)) return null;

		const attrType = checkFunction(arithExpr.operator, [left, right], errors);
		if (hasError(errors)) return null;

		return {
			type: arithExpr.operator === "+" ? "add" : "subtract",
			args: [left, right],
			attrType: attrType,
		};
	}
	return operand;
}

function resolveValue(
	value: Value,
	context: Context,
	errors: Record<string, string>,
): unknown {
	if (
		value &&
		typeof value === "object" &&
		"type" in value &&
		value.type === "AttributeValue"
	) {
		const attrValue = value as { type: "AttributeValue"; name: string };
		return resolveAttrVal(attrValue.name, context, errors);
	}
	return value;
}

function resolveFunction(
	func: FunctionCall,
	context: Context,
	errors: Record<string, string>,
): unknown {
	const resolvedArgs: unknown[] = [];

	for (const arg of func.args) {
		const resolved = resolveOperand(arg, context, errors);
		if (hasError(errors)) return null;
		resolvedArgs.push(resolved);
	}

	const attrType = checkFunction(func.name, resolvedArgs, errors);
	if (hasError(errors)) return null;

	return {
		type: "function",
		name: func.name,
		args: resolvedArgs,
		attrType: attrType,
	};
}

function checkReserved(
	name: string,
	isReserved: (name: string) => boolean,
	errors: Record<string, string>,
) {
	if (isReserved(name) && !errors.reserved) {
		errors.reserved = `Attribute name is a reserved keyword; reserved keyword: ${name}`;
	}
}

function checkFunction(
	name: string,
	args: unknown[],
	errors: Record<string, string>,
): string | null {
	if (errors.unknownFunction) {
		return null;
	}

	const functions: Record<string, number> = {
		if_not_exists: 2,
		list_append: 2,
		"+": 2,
		"-": 2,
	};

	const numOperands = functions[name];
	if (numOperands == null) {
		errors.unknownFunction = `Invalid function name; function: ${name}`;
		return null;
	}

	if (errors.function) {
		return null;
	}

	if (numOperands !== args.length) {
		errors.function = `Incorrect number of operands for operator or function; operator or function: ${name}, number of operands: ${args.length}`;
		return null;
	}

	switch (name) {
		case "if_not_exists":
			if (!Array.isArray(args[0])) {
				errors.function = `Operator or function requires a document path; operator or function: ${name}`;
				return null;
			}
			return getType(args[1]);
		case "list_append":
			for (let i = 0; i < args.length; i++) {
				const type = getImmediateType(args[i]);
				if (type && type !== "L") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return null;
				}
			}
			return "L";
		case "+":
		case "-":
			for (let i = 0; i < args.length; i++) {
				const type = getImmediateType(args[i]);
				if (type && type !== "N") {
					errors.function = `Incorrect operand type for operator or function; operator or function: ${name}, operand type: ${type}`;
					return null;
				}
			}
			return "N";
	}
	return null;
}

function resolveAttrName(
	name: string,
	context: Context,
	errors: Record<string, string>,
): string | null {
	if (errors.attrName) {
		return null;
	}
	if (!context.attrNames || !context.attrNames[name]) {
		errors.attrName = `An expression attribute name used in the document path is not defined; attribute name: ${name}`;
		return null;
	}
	return context.attrNames[name];
}

function resolveAttrVal(
	name: string,
	context: Context,
	errors: Record<string, string>,
): unknown {
	if (errors.attrVal) {
		return null;
	}
	if (!context.attrVals || !context.attrVals[name]) {
		errors.attrVal = `An expression attribute value used in expression is not defined; attribute value: ${name}`;
		return null;
	}
	return context.attrVals[name];
}

function checkPath(
	path: (string | number)[],
	paths: (string | number)[][],
	errors: Record<string, string>,
) {
	if (errors.pathOverlap || !Array.isArray(path)) {
		return;
	}
	for (let i = 0; i < paths.length; i++) {
		checkPaths(paths[i], path, errors);
		if (errors.pathOverlap || errors.pathConflict) {
			return;
		}
	}
	paths.push(path);
}

function checkPaths(
	path1: (string | number)[],
	path2: (string | number)[],
	errors: Record<string, string>,
) {
	for (let i = 0; i < path1.length && i < path2.length; i++) {
		if (typeof path1[i] !== typeof path2[i]) {
			errors.pathConflict = `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
			return;
		}
		if (path1[i] !== path2[i]) return;
	}
	if (!errors.pathOverlap) {
		errors.pathOverlap = `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
	}
}

function pathStr(path: (string | number)[]): string {
	return `[${path
		.map((piece) => {
			return typeof piece === "number" ? `[${piece}]` : piece;
		})
		.join(", ")}]`;
}

function checkOperator(
	operator: string,
	val: unknown,
	errors: Record<string, string>,
): string | null {
	if (errors.operand || !val) {
		return null;
	}
	const typeMappings: Record<string, string> = {
		S: "STRING",
		N: "NUMBER",
		B: "BINARY",
		NULL: "NULL",
		BOOL: "BOOLEAN",
		L: "LIST",
		M: "MAP",
		SS: "STRING_SET",
		NS: "NUMBER_SET",
		BS: "BINARY_SET",
	};
	const type = getImmediateType(val);
	if (type && typeMappings[type] && !(operator === "ADD" && type === "N")) {
		if (operator === "DELETE" && !type.endsWith("S")) {
			errors.operand = `Incorrect operand type for operator or function; operator: ${operator}, operand type: ${typeMappings[type]}`;
		} else if (operator === "ADD" && type !== "N") {
			errors.operand = `Incorrect operand type for operator or function; operator: ${operator}, operand type: ${typeMappings[type]}`;
		}
	}
	return type;
}

function getType(val: unknown): string | null {
	if (!val || typeof val !== "object" || Array.isArray(val)) return null;
	if (val && typeof val === "object" && "attrType" in val) {
		return (val as { attrType: string }).attrType;
	}
	return getImmediateType(val);
}

function getImmediateType(val: unknown): string | null {
	if (!val || typeof val !== "object" || Array.isArray(val)) return null;
	if (val && typeof val === "object" && "attrType" in val) return null;

	const types = ["S", "N", "B", "NULL", "BOOL", "SS", "NS", "BS", "L", "M"];
	for (let i = 0; i < types.length; i++) {
		if (
			val &&
			typeof val === "object" &&
			types[i] in val &&
			(val as Record<string, unknown>)[types[i]] != null
		) {
			return types[i];
		}
	}
	return null;
}

function checkErrors(errors: Record<string, string>): string | null {
	const errorOrder = [
		"reserved",
		"unknownFunction",
		"section",
		"attrName",
		"attrVal",
		"pathOverlap",
		"pathConflict",
		"operand",
		"function",
	];
	for (let i = 0; i < errorOrder.length; i++) {
		if (errors[errorOrder[i]]) return errors[errorOrder[i]];
	}
	return null;
}

function hasError(errors: Record<string, string>): boolean {
	return Object.keys(errors).length > 0;
}
