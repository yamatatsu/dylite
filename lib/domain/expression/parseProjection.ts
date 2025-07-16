import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import type { PathExpression } from "./PathExpression";
import type { Context } from "./context";
import projectionParser from "./grammar-projection";

// AST Types
export type ProjectionExpression = {
	type: "ProjectionExpression";
	paths: PathExpression[];
};

export function parseProjection(
	expression: string,
	options: {
		ExpressionAttributeNames: QueryCommandInput["ExpressionAttributeNames"];
	},
): ProjectionExpression | string {
	const ast: ProjectionExpression = projectionParser.parse(expression, {
		context: {
			attrNameMap: options.ExpressionAttributeNames ?? {},
			attrValMap: {},
		} satisfies Context,
	});

	for (const path of ast.paths) {
		const reserved = path.getReservedWord();
		if (reserved) {
			return `Attribute name is a reserved keyword; reserved keyword: ${reserved}`;
		}
	}
	for (const path of ast.paths) {
		const unresolvableAlias = path.getUnresolvableAlias();
		if (unresolvableAlias) {
			return `An expression attribute name used in the document path is not defined; attribute name: ${unresolvableAlias}`;
		}
	}

	const pairs = getCombinations(ast.paths);
	for (const [path1, path2] of pairs) {
		if (path1.isOverlappedOf(path2)) {
			return `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${path1}, path two: ${path2}`;
		}
	}
	for (const [path1, path2] of pairs) {
		if (path1.isConflictWith(path2)) {
			return `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${path1}, path two: ${path2}`;
		}
	}

	return ast;
}

/**
 * Generates all unique pairs (combinations) of elements from a single array.
 *
 * @example
 * const numbers = [1, 2, 3];
 * const combinations = getCombinations(numbers);
 * // Expected output: [[1, 2], [1, 3], [2, 3]]
 *
 * @example
 * const letters = ['a', 'b', 'c', 'd'];
 * const letterCombinations = getCombinations(letters);
 * // Expected output:
 * // [
 * //   ['a', 'b'], ['a', 'c'], ['a', 'd'],
 * //   ['b', 'c'], ['b', 'd'],
 * //   ['c', 'd']
 * // ]
 *
 * @example
 * const singleElement = ['only'];
 * const emptyCombinations = getCombinations(singleElement);
 * // Expected output: []
 *
 * @example
 * const emptyArray = [];
 * const anotherEmptyCombinations = getCombinations(emptyArray);
 * // Expected output: []
 */
function getCombinations<T>(arr: T[]): [T, T][] {
	const result: [T, T][] = [];

	for (let i = 0; i < arr.length; i++) {
		for (let j = i + 1; j < arr.length; j++) {
			result.push([arr[i], arr[j]]);
		}
	}

	return result;
}
