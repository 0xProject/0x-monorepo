## @0x/sra-spec

Contains the Standard Relayer API [OpenAPI Spec](https://github.com/OAI/OpenAPI-Specification).

The package distributes both a javascript object version and a json version.

A deployed [ReDoc](https://github.com/Rebilly/ReDoc) static site with the API can be found here http://sra-spec.s3-website-us-east-1.amazonaws.com/.

## Usage

```
import { api } from '@0x/sra-spec';
```

## Installation

```
yarn install
```

## Development

You can start a development server that will serve a [ReDoc](https://github.com/Rebilly/ReDoc) documentation instance. It uses the `api.json` file from `lib/` (you must have built at least once with `yarn build` or `yarn build-json`) that is based on the `api` object exported from `src`.

```
yarn watch_without_deps
```

The process will watch for changes, but will not hot-reload so you must refresh the page to see the changes.

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
PKG=@0x/sra-spec yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/sra-spec yarn watch
```

### Static Site

We also [host a static HTML version of the docs on S3](http://sra-spec.s3-website-us-east-1.amazonaws.com/) for easy sharing.

To build and deploy the site run

```
yarn deploy-site
```

**NOTE: On deploying the site, it will say the site is available at a non-existent URL. Please ignore and use the (now updated) URL above.**

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
