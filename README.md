<img src="https://github.com/0xProject/branding/blob/master/0x_Black_CMYK.png" width="200px" >

---

[0x][website-url] is an open protocol that facilitates trustless, low friction exchange of Ethereum-based assets. A full description of the protocol may be found in our [whitepaper][whitepaper-url].

This repository contains all the 0x developer tools written in TypeScript. Our hope is that these tools make it easy to build Relayers and other DApps that use the 0x protocol.

[website-url]: https://0xproject.com/
[whitepaper-url]: https://0xproject.com/pdfs/0x_white_paper.pdf

[![CircleCI](https://circleci.com/gh/0xProject/0x.js.svg?style=svg&circle-token=61bf7cd8c9b4e11b132089dfcffdd1be277d1e0c)](https://circleci.com/gh/0xProject/0x.js)
[![npm version](https://badge.fury.io/js/0x.js.svg)](https://badge.fury.io/js/0x.js)
[![Coverage Status](https://coveralls.io/repos/github/0xProject/0x.js/badge.svg?branch=master&t=fp0cXD)](https://coveralls.io/github/0xProject/0x.js?branch=master)
[![Slack Status](http://slack.0xProject.com/badge.svg)](http://slack.0xProject.com)
[![Join the chat at https://gitter.im/0xProject/Lobby](https://badges.gitter.im/0xProject/Lobby.svg)](https://gitter.im/0xProject/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Greenkeeper badge](https://badges.greenkeeper.io/0xProject/0x.js.svg?token=7c22e5c72acf39d3ead8d29c5d9bb38f9096df3e643024dcedd53ab732847be1&ts=1496426342666)](https://greenkeeper.io/)

Instructions
------------

Make sure you have `yarn@1.x` installed locally.

### Creating a new sub-package

1. Make sure the `name` field in the sub-package's `package.json` starts with `@0xproject/` and has a unique name (e.g `@0xproject/assert`).

2. Run `yarn install` to install all it's dependencies.

### How to add a sub-package as a dependency to another sub-package:

1. Add the sub-packages name (declared in it's `package.json`) to your sub-packages `package.json` under `dependencies` or `devDependencies`.

2. Run `yarn install` from anywhere in the mono repo.

3. Import the sub-package as:

```
import {myPkg} from '@0xproject/myPkg';
```
