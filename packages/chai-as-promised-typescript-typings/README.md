## chai-as-promised-typescript-typings

Fork of type definitions for chai-as-promised that includes changes made by dirty-chai

## Installation

```bash
yarn add -D chai-as-promised-typescript-typings
```

## Usage

Add the following line within an `include` section of your `tsconfig.json`

```json
"./node_modules/chai-as-promised-typescript-typings/index.d.ts"
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
