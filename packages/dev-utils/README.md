## Dev utils

Dev utils to be shared across 0x projects and packages

## Configuration

Some env variables might be set to change the behaviour of created web3 providers/instances.

```
VERBOSE_GANACHE: boolean. Enables verbose Ganache logging. Every request/response payload. Slightly slower, but useful for testing.
SOLIDITY_COVERAGE: boolean. If set - adds coverage subprovider which intercepts all calls/transactions and can be later used to compute code coverage.
```

Boolean env variables should be either `true` or `false`. Defaults to `false` if not set.

## Install

```bash
yarn add @0xproject/dev-utils
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```
"include": [
    "./node_modules/web3-typescript-typings/index.d.ts",
]
```
