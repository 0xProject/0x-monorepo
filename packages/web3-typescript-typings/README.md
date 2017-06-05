Web3 Typescript Type Definition
-------------------------------

There currently isn't an official [Web3][Web3]
type definition included in the [DefinitelyTyped][DefinitelyTyped] project.
Until that happens, we will continue to improve our own type definition.
If it get's close to comprehensive, we'll add it to [DefinitelyTyped][DefinitelyTyped].

[Web3]: https://github.com/ethereum/web3.js/
[DefinitelyTyped]: https://github.com/DefinitelyTyped/DefinitelyTyped

# Installation
Using npm:
```
npm install --save-dev web3-typescript-typings
```
Using yarn:
```
yarn add web3-typescript-typings -D
```
Also don't forget to manually include `index.d.ts` within an `include` section of your `tsconfig.json`
```
"include": [
    ...
    "./node_modules/web3-typescript-typings/index.d.ts"
]
```
And you're ready to go to a bright type-safe and distributed future!