Welcome to the [sol-compiler](https://github.com/0xProject/0x-monorepo/tree/development/packages/sol-compiler) documentation! Sol-compiler is a wrapper around [solc-js](https://www.npmjs.com/package/solc) that adds:

*   Smart re-compilation: Only recompiles when smart contracts have changed
*   Ability to compile an entire project instead of only individual `.sol` files
*   Compilation using the Solidity version specified at the top of each individual `.sol` file
*   Proper parsing of Solidity version ranges
*   Support for the standard [input description](https://solidity.readthedocs.io/en/develop/using-the-compiler.html#input-description) for what information you'd like added to the resulting `artifacts` file (i.e 100% configurable artifacts content).
*   Storage of constructor args, source maps and paths to all dependency source files.
