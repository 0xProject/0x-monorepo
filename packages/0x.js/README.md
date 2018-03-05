## 0x.js

## Installation

0x.js ships as both a [UMD](https://github.com/umdjs/umd) module and a [CommonJS](https://en.wikipedia.org/wiki/CommonJS) package.

#### CommonJS _(recommended)_:

**Install**

```bash
npm install 0x.js --save
```

**Import**

```javascript
import { ZeroEx } from '0x.js';
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```
"include": [
    "./node_modules/web3-typescript-typings/index.d.ts",
    "./node_modules/ethers-typescript-typings/index.d.ts"
]
```

#### UMD:

**Install**

Download the UMD module from our [releases page](https://github.com/0xProject/0x-monorepo/releases) and add it to your project.

**Import**

```html
<script type="text/javascript" src="0x.js"></script>
```

## Documentation

Extensive documentation of 0x.js can be found on [our website][docs-url].

[website-url]: https://0xproject.com/
[whitepaper-url]: https://0xproject.com/pdfs/0x_white_paper.pdf
[docs-url]: https://0xproject.com/docs/0xjs
