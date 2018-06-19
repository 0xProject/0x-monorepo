These templates are used with [abi-gen](https://github.com/0xProject/0x-monorepo/tree/development/packages/abi-gen).

To successfully compile the generated TypeScript contract wrappers, you must:

*   Install the packages on which the main contract template directly depends: `yarn add @0xproject/base-contract @0xproject/sol-compiler @0xproject/utils @0xproject/web3-wrapper ethereum-types ethers lodash`
*   Install the packages on which the main contract template *in*directly depends: `yarn add @types/lodash`
*   Ensure that your TypeScript configuration includes the following:

```
"compilerOptions": {
  "lib": ["ES2015"],
  "typeRoots": [
    "node_modules/@0xproject/typescript-typings/types",
    "node_modules/@types"
  ]
}
```
