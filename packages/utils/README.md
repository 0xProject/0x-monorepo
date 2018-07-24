## @0xproject/utils

Utils to be shared across 0x projects and packages

## Installation

```bash
yarn add @0xproject/utils
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0xproject/typescript-typings/types", "node_modules/@types"],
}
```

## Usage

```javascript
import { addressUtils, bigNumberConfigs, classUtils, intervalUtils, promisify } from '@0xproject/utils';
```

## Troubleshooting

If you are still seeing TS type errors complaining about missing DOM types such as `Response`:

```
error TS2304: Cannot find name 'Response'.
```

Then you need to explicitly add the `dom` lib to your compiler options in `tsconfig.json`. The `dom` library is included by default, but customizing the `lib` option can cause it to be dropped.

```
"compilerOptions": {
    "lib": [..., "dom"],
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
PKG=@0xproject/utils yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0xproject/utils yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
