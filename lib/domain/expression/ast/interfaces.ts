export interface IAstNode {
	readonly type: string;
	traverse(visitor: (node: unknown) => void): void;
}
