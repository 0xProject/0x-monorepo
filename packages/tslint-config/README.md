tslint-config
------

TSLint configuration and custom linter rules used by 0xProject.

## Installation

```bash
yarn add --dev @0xproject/tslint-config
```

## Usage

```json
{
  "extends": [
    "@0xproject/tslint-config"
  ]
}
```

## Contributing

We strongly encourage our community members to help us make improvements and to determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

[CONTRIBUTING.md](../../CONTRIBUTING.md)

### Install Dependencies

If you don't have yarn workspaces enabled - enable them:
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

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
