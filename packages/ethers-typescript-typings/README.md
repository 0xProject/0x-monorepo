## ethers-typescript-typings

There currently isn't an official [Ethers][ethers]
type definition included in the [DefinitelyTyped][definitelytyped] project.
Until that happens, we will continue to improve our own type definition.
If it get's close to comprehensive, we'll add it to [DefinitelyTyped][definitelytyped].

[ethers]: https://github.com/ethers-io/ethers.js
[definitelytyped]: https://github.com/DefinitelyTyped/DefinitelyTyped

## Installation

```bash
yarn add -D ethers-typescript-typings
```

## Usage

Add the following line within an `include` section of your `tsconfig.json`

```json
"./node_modules/ethers-typescript-typings/index.d.ts"
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
