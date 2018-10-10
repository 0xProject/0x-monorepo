## Dev tools pages

This repository contains our dev tools pages.

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

## Local Dev Setup

Requires Node version 6.9.5 or higher

### Install dependencies:

```bash
yarn install
```

### Initial setup

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0xproject/dev-tools-pages yarn build
```

### Run dev server

```bash
PKG=@0xproject/dev-tools-pages yarn watch
```

Visit [http://localhost:3572/](http://localhost:3572/) in your browser.

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Resources

##### Toolkit

*   [Styled Components](https://www.styled-components.com/)
*   [Rebass](https://rebassjs.org/)

##### Recommended Atom packages:

*   [atom-typescript](https://atom.io/packages/atom-typescript)
*   [linter-tslint](https://atom.io/packages/linter-tslint)
