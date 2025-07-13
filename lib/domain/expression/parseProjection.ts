import type { QueryCommandInput } from "@aws-sdk/client-dynamodb";
import type { PathSegment } from "./PathSegment";
import type { Context } from "./context";
import projectionParser from "./projection-grammar";

// AST Types
export type ProjectionExpression = {
	type: "ProjectionExpression";
	paths: PathExpression[];
};

export type PathExpression = {
	type: "PathExpression";
	segments: PathSegment[];
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

	const paths: PathSegment[][] = [];

	// Process each path for validation
	for (const pathExpr of ast.paths) {
		const path: PathSegment[] = [];

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
			path.push(segment);
		}

		// Check for path conflicts/overlaps
		if (!errors.pathOverlap && !errors.pathConflict) {
			checkPath(path, paths, errors);
		}

		paths.push(path);
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
	newPath: PathSegment[],
	existingPaths: PathSegment[][],
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
	path1: PathSegment[],
	path2: PathSegment[],
	errors: {
		pathOverlap?: string;
		pathConflict?: string;
	},
) {
	for (let i = 0; i < path1.length && i < path2.length; i++) {
		if (path1[i].isArrayIndex !== path2[i].isArrayIndex) {
			errors.pathConflict = `Two document paths conflict with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
			return;
		}
		if (path1[i].value() !== path2[i].value()) return;
	}

	errors.pathOverlap = `Two document paths overlap with each other; must remove or rewrite one of these paths; path one: ${pathStr(path1)}, path two: ${pathStr(path2)}`;
}

function pathStr(path: PathSegment[]): string {
	return `[${path.map((seg) => seg.toString()).join(", ")}]`;
}
