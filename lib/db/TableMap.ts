import type { MemoryLevel } from "memory-level";
import type { TableDescription } from "../domain/TableDescription";
import { resourceInUseException, validationException } from "../domain/errors";
import { Table } from "./Table";

export class TableMap {
	private readonly map = new Map<string, Table>();

	constructor(private readonly level: MemoryLevel) {}

	getTable(tableName: string): Table | null {
		const table = this.map.get(tableName);
		return table ?? null;
	}
	addTable(description: TableDescription): void {
		if (this.map.has(description.tableName)) {
			throw resourceInUseException("");
		}
		const table = new Table(this.level, description);
		this.map.set(table.tableName, table);
	}
	listTableNames(): string[] {
		return Array.from(this.map.keys());
	}
	async deleteTable(tableName: string): Promise<Table> {
		const table = this.map.get(tableName);
		if (!table) {
			throw validationException("Cannot do operations on a non-existent table");
		}
		this.map.delete(tableName);
		return table;
	}
}
