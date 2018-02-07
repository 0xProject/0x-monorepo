## @0xproject/tslint-config

TSLint configuration and custom linter rules used by 0xProject.

## Installation

```bash
yarn add --dev @0xproject/tslint-config
```

## Usage

Add the following to your `tslint.json` file

```json
{
    "extends": ["@0xproject/tslint-config"]
}
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

### Build

```bash
yarn build
```

or

```bash
yarn build:watch
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
