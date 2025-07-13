import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import type { PathExpression } from "./PathExpression";
import type { Context } from "./context";
import projectionParser from "./projection-grammar";

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

	// Validate AST
	const errors: {
		reserved?: string;
		attrNameVal?: string;
		pathOverlap?: string;
		pathConflict?: string;
	} = {};

	const paths: PathExpression[] = [];

	// Process each path for validation
	for (const pathExpr of ast.paths) {
		// Process segments
		for (const segment of pathExpr.segments) {
			if (segment.type === "Identifier") {
				// Check for reserved words
				if (!errors.reserved && segment.isReserved()) {
					errors.reserved = `Attribute name is a reserved keyword; reserved keyword: ${segment}`;
				}
			} else if (segment.type === "Alias") {
				// Validate alias
				if (!errors.attrNameVal && segment.isUnresolvable()) {
					errors.attrNameVal = `An expression attribute name used in the document path is not defined; attribute name: ${segment}`;
				}
			}
		}

		// Check for path conflicts/overlaps
		if (!errors.pathOverlap && !errors.pathConflict) {
			checkPath(pathExpr, paths, errors);
		}

		paths.push(pathExpr);
	}

	// Check errors in order
	const errorOrder: (keyof typeof errors)[] = [
		"reserved",
		"attrNameVal",
		"pathOverlap",
		"pathConflict",
	];
	for (const errorKey of errorOrder) {
		if (errors[errorKey]) {
			return errors[errorKey];
		}
	}

	return ast;
}

function checkPath(
	newPath: PathExpression,
	existingPaths: PathExpression[],
	errors: {
		pathOverlap?: string;
		pathConflict?: string;
	},
) {
	for (const existingPath of existingPaths) {
		checkPaths(existingPath, newPath, errors);
		if (errors.pathOverlap || errors.pathConflict) {
			return;
		}
	}
}

function checkPaths(
	path1: PathExpression,
	path2: PathExpression,
	errors: {
		pathOverlap?: string;
		pathConflict?: string;
	},
) {
	for (let i = 0; i < path1.size() && i < path2.size(); i++) {
		if (path1.at(i)?.isArrayIndex !== path2.at(i)?.isArrayIndex) {
			errors.pathConflict = `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${path1}, path two: ${path2}`;
			return;
		}
		if (path1.at(i)?.value() !== path2.at(i)?.value()) return;
	}

	errors.pathOverlap = `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${path1}, path two: ${path2}`;
}
