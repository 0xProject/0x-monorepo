## Dev tools pages

This repository contains our dev tools pages.

## Local Dev Setup

Requires Node version 6.9.5 or higher & yarn v1.9.4

### 1. Install dependencies for monorepo:

Make sure you install Yarn v1.9.4 (npm won't work!). We rely on our `yarn.lock` file and on Yarn's support for `workspaces` in our monorepo setup.

```bash
yarn install
```

### 2. Initial setup

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0xproject/dev-tools-pages yarn build
```

Note: Ignore the `WARNING in asset size limit` and `WARNING in entrypoint size limit` warnings.

### 3. Run dev server

```bash
cd packages/dev-tools-pages
yarn dev
```

Visit [http://localhost:3572/](http://localhost:3572/) in your browser.

The webpage will refresh when source code is changed.

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Prettier

Run from the monorepo root directory:

```
yarn prettier
```

### Resources

##### Toolkit

*   [Styled Components](https://www.styled-components.com/)
*   [BassCSS](http://basscss.com/)

##### Recommended Atom packages:

*   [atom-typescript](https://atom.io/packages/atom-typescript)
*   [linter-tslint](https://atom.io/packages/linter-tslint)

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.
