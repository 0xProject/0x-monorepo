## @0x/instant

## Installation

```bash
yarn add @0x/instant
```

**Import**

**CommonJS module**

```typescript
import { ZeroExInstant } from '@0x/instant';
```

or

```javascript
var ZeroExInstant = require('@0x/instant').ZeroExInstant;
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
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

## Deploying

You can deploy a work-in-progress version of 0x Instant at http://0x-instant-dogfood.s3-website-us-east-1.amazonaws.com for easy sharing.

To build and deploy the site run

```
yarn deploy_dogfood
```

We also have a staging bucket that is to be updated less frequently can be used to share instant externally: http://0x-instant-staging.s3-website-us-east-1.amazonaws.com/

To build and deploy to this bucket, run

```
yarn deploy_staging
```

**NOTE: On deploying the site, it will say the site is available at a non-existent URL. Please ignore and use the (now updated) URL above.**

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
PKG=@0x/instant yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/instant yarn watch
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
