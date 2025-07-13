import type { PathSegment } from "./PathSegment";

export class PathExpression {
	public readonly type = "PathExpression";

	constructor(public readonly segments: PathSegment[]) {}

	at(index: number): PathSegment | undefined {
		return this.segments[index];
	}

	size(): number {
		return this.segments.length;
	}

	toString(): string {
		return `[${this.segments.map((seg) => seg.toString()).join(", ")}]`;
	}
}
