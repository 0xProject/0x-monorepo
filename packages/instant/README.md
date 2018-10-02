## @0xproject/instant

## Installation

```bash
yarn add @0xproject/instant
```

**Import**

**CommonJS module**

```typescript
import { ZeroExInstant } from '@0xproject/instant';
```

or

```javascript
var ZeroExInstant = require('@0xproject/instant').ZeroExInstant;
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0xproject/typescript-typings/types", "node_modules/@types"],
}
```

**UMD Module**

The package is also available as a UMD module named `zeroExInstant`.

```html
<head>
    <script type="text/javascript" src="[zeroExInstantUMDPath]" charset="utf-8"></script>
</head>
<body>
    <div id="zeroExInstantContainer"></div>
    <script>
        zeroExInstant.render({
            // Initialization options
        }, '#zeroExInstantContainer');
    </script>
</body>
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
PKG=@0xproject/instant yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0xproject/instant yarn watch
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
