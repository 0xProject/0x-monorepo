## @0x/tslint-config

TSLint configuration and custom linter rules used by 0xProject.

## Installation

```bash
yarn add --dev @0x/tslint-config
```

## Usage

Add the following to your `tslint.json` file

```json
{
    "extends": ["@0x/tslint-config"]
}
```

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

### Build

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0x/tslint-config yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/tslint-config yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
