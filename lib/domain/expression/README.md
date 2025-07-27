# DynamoDB Expression Engine

This directory implements a comprehensive engine for parsing and validating DynamoDB expressions. It handles **Condition Expressions**, **Update Expressions**, and **Projection Expressions**, forming a critical component for emulating native DynamoDB behavior.

The implementation is heavily inspired by and partially derived from [Dynalite](https://github.com/architect/dynalite/tree/f1b4602d44474a92983419c8d733fcac74e389f5/db).

## Architecture

The expression engine follows a multi-stage process to parse and validate expressions, ensuring correctness at both the syntax and semantic levels.

```
Expression String
       |
       v
+----------------+
|  Peggy Parser  |  (Generated from .pegjs grammar)
+----------------+
       |
       v
+----------------+
|      AST       |  (Abstract Syntax Tree in `ast/`)
|  (Validation)  |
+----------------+
       |
       v
 Validated AST
```

1.  **Grammar Definition (`.pegjs`)**: The syntax of each expression type is defined using [Peggy (PEG.js)](https://peggyjs.org/) grammar. These files (`grammar-*.pegjs`) are the source of truth for the expression language structure.
2.  **Parser Generation**: The `pnpm build` command uses Peggy to compile the `.pegjs` grammar files into JavaScript parser modules (`grammar-*.js`).
3.  **AST (Abstract Syntax Tree)**: When a parser processes an expression string, it generates an Abstract Syntax Tree. The `ast/` directory contains classes that represent the nodes of this tree.
4.  **Semantic Validation**: The AST classes are responsible for performing semantic validation. This is a crucial step that catches errors the grammar alone cannot, such as type mismatches, use of reserved keywords, or conflicting document paths. If validation fails, a specific `AstError` is thrown.
5.  **Public API (`parse*.ts`)**: The `parseCondition`, `parseUpdate`, and `parseProjection` functions serve as the public interface for this engine. They orchestrate the parsing and validation process, returning a fully validated AST or a descriptive error message.

## Expression Parsers

This engine provides three distinct parsers, one for each type of DynamoDB expression.

### 1. Condition Expression

-   **Grammar**: `grammar-condition.pegjs`
-   **AST Entrypoint**: `ast/ConditionExpression.ts`
-   **Parser API**: `parseCondition.ts`

Handles condition expressions used in write (`PutItem`, `UpdateItem`, `DeleteItem`) and read (`Query`, `Scan`) operations. A condition must evaluate to true for the operation to proceed.

**Features**:
*   **Comparators**: `=`, `<>`, `<`, `<=`, `>`, `>=`
*   **Keywords**: `BETWEEN`, `IN`
*   **Logical Operators**: `AND`, `OR`, `NOT`
*   **Functions**: `attribute_exists`, `attribute_not_exists`, `attribute_type`, `begins_with`, `contains`, `size`

### 2. Update Expression

-   **Grammar**: `grammar-update.pegjs`
-   **AST Entrypoint**: `ast/UpdateExpression.ts`
-   **Parser API**: `parseUpdate.ts`

Handles update expressions for the `UpdateItem` operation, allowing for the modification of specific attributes.

**Supported Actions**:
*   **`SET`**: Adds or modifies an attribute. Supports arithmetic (`+`, `-`) and functions like `if_not_exists` and `list_append`.
*   **`REMOVE`**: Deletes attributes from an item.
*   **`ADD`**: Atomically increments/decrements a number or adds elements to a set.
*   **`DELETE`**: Removes elements from a set.

### 3. Projection Expression

-   **Grammar**: `grammar-projection.pegjs`
-   **AST Entrypoint**: `ast/ProjectionExpression.ts`
-   **Parser API**: `parseProjection.ts`

Handles projection expressions for read (`GetItem`, `Query`, `Scan`) operations to specify which attributes to return, minimizing data transfer.

## Semantic Validation (`ast/`)

The AST is not just a data structure; it's an active validation layer. After parsing, the `validate()` method is called on the root AST node, which traverses the tree and checks for a wide range of semantic errors defined in `ast/AstError.ts`, including:

-   `ReservedKeywordError`: An attribute name is a DynamoDB reserved word.
-   `UnresolvableAttributeNameError`: An Expression Attribute Name (e.g., `#name`) is used but not defined.
-   `UnresolvableAttributeValueError`: An Expression Attribute Value (e.g., `:val`) is used but not defined.
-   `IncorrectOperandTypeError`: An operator or function is used with an operand of the wrong data type (e.g., `ADD`ing a string).
-   `OverlappedPathError`: Two document paths conflict (e.g., `SET a.b = 1, a = 2`).
-   `DuplicateSectionError`: An update expression contains more than one of the same action (e.g., two `SET` clauses).
-   And many more...

## Build Process

Running the `pnpm build` command will parse the `.pegjs` files and create the corresponding `.js` and `.d.ts` files.

## Testing

To run unit tests for the expression parsers:

```bash
# Run all unit tests in this directory
pnpm test:unit -- lib/domain/expression/

# Run tests for a specific parser
pnpm test:unit -- lib/domain/expression/parseProjection.test.ts
pnpm test:unit -- lib/domain/expression/parseCondition.test.ts
pnpm test:unit -- lib/domain/expression/parseUpdate.test.ts
```

## Core Concepts of DynamoDB Expressions

*   **Expression Attribute Names**: Used as placeholders for actual attribute names, especially when the name is a DynamoDB reserved word or contains special characters. They begin with a pound sign (`#`). For example, `#n` could be a placeholder for the attribute `Name`.
*   **Expression Attribute Values**: Used as placeholders for actual values in an expression to avoid injection issues and to handle values that are not item attributes. They begin with a colon (`:`). For example, `:v` could represent the value `5`.

For more details, see the official documentation on [Referring to Item Attributes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.Attributes.html), [Expression Attribute Names](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeNames.html), and [Expression Attribute Values](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ExpressionAttributeValues.html).
