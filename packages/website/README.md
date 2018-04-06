## Website & 0x Portal DApp

This repository contains our website and [0x Portal DApp][portal-url] (over-the-counter exchange), facilitating trustless over-the-counter trading of Ethereum-based tokens using 0x protocol.

[website-url]: https://0xproject.com/
[whitepaper-url]: https://0xproject.com/pdfs/0x_white_paper.pdf
[portal-url]: https://0xproject.com/portal

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

## Local Dev Setup

Requires Node version 6.9.5 or higher.

Add the following to your `/etc/hosts` file:

```
127.0.0.1 0xproject.localhost
```

### Install dependencies:

```bash
yarn install
```

### Initial setup

The **first** time you work with this package, you must build **all** packages within the monorepo. This is because packages that depend on other packages located inside this monorepo are symlinked when run from **within** the monorepo. This allows you to make changes across multiple packages without first publishing dependent packages to NPM. To build all packages, run the following from the monorepo root directory:

```bash
yarn lerna:rebuild
```

### Run dev server

The the `website` root directory, run:

```bash
yarn dev
```

Visit [0xproject.localhost:3572](http://0xproject.localhost:3572) in your browser.

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

*   [Material Design Icon Font](http://zavoloklom.github.io/material-design-iconic-font/icons.html#directional)
*   [BassCSS toolkit](http://basscss.com/)
*   [Material-UI component library](http://www.material-ui.com/#/)

##### Recommended Atom packages:

*   [atom-typescript](https://atom.io/packages/atom-typescript)
*   [linter-tslint](https://atom.io/packages/linter-tslint)
