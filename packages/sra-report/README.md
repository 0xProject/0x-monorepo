# SRA Report

This package allows you to generate reports detailing an endpoint's [standard relayer API HTTP specification](https://github.com/0xProject/standard-relayer-api/blob/master/http/v0.md) compliance.

## Installation

`yarn add -g @0xproject/sra-report`

## Usage

```
sra-report
Options:
  --help               Show help                                       [boolean]
  --version            Show version number                             [boolean]
  --url, -u            API endpoint to test for standard relayer API compliance
                                                             [string] [required]
  --output, -o, --out  Folder where to write the reports                [string]
  --network-id, -n     ID of the network that the API is serving orders from
                                                           [number] [default: 1]
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

### Lint

```bash
yarn lint
```
