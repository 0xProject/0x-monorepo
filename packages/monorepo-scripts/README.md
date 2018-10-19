## Mono repo scripts

This repository contains a few helpful scripts for working with this mono repo.

#### Scripts

**`yarn deps_versions`**: Since we are a Yarn workspaces monorepo, shared dependencies between packages in the monorepo get hoisted to a top-level `node_modules` directory. If two packages use different versions of the same dependency however, both get installed. To avoid having many versions of a dependency installed, we try to keep dependency versions the same across packages in the monorepo. This script will list any dependencies for which we have multiple versions installed. We can then go through them and try to consolidate to a single version where possible.

**`yarn find_unused_deps`**: Sometimes we accidentally leave dependencies listed in `package.json` that are no longer being used. This script finds potential dependencies that might no longer be in use. Please verify that it is no longer in use before removing, the `depcheck` package we use under-the-hood doesn't handle some TS quirks perfectly.

**`yarn test:publish`**: Execute a test-run of the publish script. This dry run won't actually publish, nor will it commit/push anything to Github.

## Usage

#### Dependency versions

In order to reduce the size of this repo, we try and use the same versions of dependencies between packages. To make it easier to discover version discrepancies between packages, you can run:

```bash
yarn scripts:deps_versions
```

This will list out any dependencies that differ in versions between packages.

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
PKG=@0x/monorepo-scripts yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/monorepo-scripts yarn watch
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
