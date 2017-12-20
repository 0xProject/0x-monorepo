Mono repo scripts
------

This repository contains a few helpful scripts for working with this mono repo.

## Usage

#### Dependency versions
In order to reduce the size of this repo, we try and use the same versions of dependencies between packages. To make it easier to discover version discrepancies between packages, you can run:

```bash
yarn deps_versions
```

This will list out any dependencies that differ in versions between packages.

## Contributing

We strongly recommend the community to help us make improvements and to determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

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

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
