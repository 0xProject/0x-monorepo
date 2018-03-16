Welcome to the [Deployer](https://github.com/0xProject/0x-monorepo/tree/development/packages/deployer) documentation! Deployer is a tool for compiling and deploying Solidity smart contracts with ease.

It serves a similar purpose as parts of the [Truffle framework](http://truffleframework.com/), but with the UNIX philosophy in mind: Make each program do one thing well. This tool is for intermediate to advanced Solidity developers that require greater configurability and reliability.

Deployer has the following advantages over Truffle:

*   Deploy each smart contract with a specific version of Solidity
*   Improved artifact files:
    *   Properly segregated artifacts to support storing different versions of smart contract deployed on different networks.
    *   Storage of contructor args and contract source code
*   An easy to maintain codebase: TypeScript + Single package
*   Allows you to specify the deployer address
*   Migrations that work with `async/await`
*   Migrations that can be written synchronously in order to guarentee deterministic contract addresses
*   No race conditions when running migrations.

Deployer can be used as a command-line tool or as an imported module.
