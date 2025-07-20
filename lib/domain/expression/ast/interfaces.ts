export interface IAstNode {
	traverse(visitor: (node: unknown) => void): void;
}
