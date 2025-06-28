# Dylite

Dylite is a mock of DynamoDB for testing.
This project aims to be compatible with DynamoDB Local.

## Features

- launch super fast and concurrently
- use in-memory database for fast startup

## Development

### Testing

This project uses three different testing environments:

- `unit`:
  - Tests each function in isolation.
- `dylite`: 
  - Tests each API works as same as DynamoDB Local.
- `ddblocal`:
  - Ensures `dylite` tests are compatible with DynamoDB Local.

To run the tests, use the following command:

```bash
pnpm test:unit

pnpm test:dylite
pnpm test:dylite -- ./tests/http/item-put.test.ts

pnpm test:ddblocal
pnpm test:ddblocal -- ./tests/http/item-put.test.ts
```
