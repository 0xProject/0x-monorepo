## Mono repo scripts

This repository contains a few helpful scripts for working with this mono repo.

#### Scripts

**`yarn deps_versions`**: Since we use Lerna + Yarn workspaces, shared dependencies between packages in the monorepo get hoisted to a top-level `node_modules` directory. If two packages use different versions of the same dependency however, both get installed. To avoid having many versions of a dependency installed, we try to keep dependency versions the same across packages in the monorepo. This script will list any dependencies for which we have multiple versions installed. We can then go through them and try to consolidate to a single version where possible.

**`yarn find_unused_deps`**: Sometimes we accidentally leave dependencies listed in `package.json` that are no longer being used. This script finds potential dependencies that might no longer be in use. Please verify that it is no longer in use before removing, the `depcheck` package we use under-the-hood doesn't handle some TS quirks perfectly.

**`yarn remove_tags`**: Our publishing script calls `lerna publish` under-the-hood. If this command fails, it might have created new versioned git tags for each package. Removing these manually is tedious, so you can also run this command instead. Before doing so, check to see if `lerna` already created the publish commit. If so, first revert that with `git reset --hard HEAD~1`, then run this command.

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

If this is your **first** time building this package, you must first build **all** packages within the monorepo. This is because packages that depend on other packages located inside this monorepo are symlinked when run from **within** the monorepo. This allows you to make changes across multiple packages without first publishing dependent packages to NPM. To build all packages, run the following from the monorepo root directory:

```bash
yarn lerna:rebuild
```

Or continuously rebuild on change:

```bash
yarn dev
```

You can also build this specific package by running the following from within its directory:

```bash
yarn build
```

or continuously rebuild on change:

```bash
yarn build:watch
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
