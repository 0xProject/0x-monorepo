<img src="https://github.com/0xProject/branding/blob/master/0x_Black_CMYK.png" width="200px" >

---

[0x][website-url] is an open protocol that facilitates trustless, low friction exchange of Ethereum-based assets. A full description of the protocol may be found in our [whitepaper][whitepaper-url].

This repository contains our website and [0x Portal DApp][portal-url] (over-the-counter exchange), facilitating trustless over-the-counter trading of Ethereum-based tokens using 0x protocol.

[website-url]: https://0xproject.com/
[whitepaper-url]: https://0xproject.com/pdfs/0x_white_paper.pdf
[portal-url]: https://0xproject.com/portal

[![Join the chat at https://gitter.im/0xProject/contracts](https://badges.gitter.im/0xProject/contracts.svg)](https://gitter.im/0xProject/contracts?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

### Local Dev Setup

Requires Node version 6.9.5 or higher.

Add the following to your `/etc/hosts` file:

```
127.0.0.1 0xproject.localhost
```

Clone the [0x contracts repo](https://github.com/0xProject/contracts) into the same parent directory as this project.

Install [yarn](https://yarnpkg.com/lang/en/docs/install/) in order to install the project dependencies more deterministically.

Install dependencies:

```
yarn
```

Import smart contract artifacts from `contracts` repo:

```
yarn run update_contracts
```

Start dev server:

```
yarn run dev
```

Visit [0xproject.localhost:3572](http://0xproject.localhost:3572) in your browser.


##### Recommended Atom packages:

- [atom-typescript](https://atom.io/packages/atom-typescript)
- [linter-tslint](https://atom.io/packages/linter-tslint)

##### Resources

- [Material Design Icon Font](http://zavoloklom.github.io/material-design-iconic-font/icons.html#directional)
- [BassCSS toolkit](http://basscss.com/)
- [Material-UI](http://www.material-ui.com/#/)
