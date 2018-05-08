Welcome to the [sol-compiler](https://github.com/0xProject/0x-monorepo/tree/development/packages/sol-compiler) documentation! Sol-compiler is a tool for compiling Solidity smart contracts and generating artifacts with ease.

It serves a similar purpose as parts of the [Truffle framework](http://truffleframework.com/), but with the UNIX philosophy in mind: Make each program do one thing well. This tool is for intermediate to advanced Solidity developers that require greater configurability and reliability.

Sol-compiler has the following advantages over Truffle:

*   Compile each smart contract with a specific version of Solidity.
*   Improved artifact files:
    *   Storage of constructor args, source maps and paths to all requisite source files.
    *   An easy to maintain codebase: TypeScript + Single repo.
    *   Supports Solidity version ranges - contract compiled with latest Solidity version that satisfies the range.

Sol-compiler can be used as a command-line tool or as an imported module.
