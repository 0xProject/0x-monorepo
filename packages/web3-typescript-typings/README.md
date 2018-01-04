## web3-typescript-typings

There currently isn't an official [Web3][web3]
type definition included in the [DefinitelyTyped][definitelytyped] project.
Until that happens, we will continue to improve our own type definition.
If it get's close to comprehensive, we'll add it to [DefinitelyTyped][definitelytyped].

[web3]: https://github.com/ethereum/web3.js/
[definitelytyped]: https://github.com/DefinitelyTyped/DefinitelyTyped

## Installation

```bash
yarn add -D web3-typescript-typings
```

## Usage

Add the following lines to compilerOptions section of your `tsconfig.json`

```json
"typeRoots": ["node_modules/@types", "node_modules/web3-typescript-typings"]
```

## Contributing

We strongly encourage that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

### Lint

```bash
yarn lint
```
