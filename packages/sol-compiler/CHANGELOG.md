<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v1.1.14 - _November 28, 2018_

    * Dependencies updated

## v1.1.13 - _November 21, 2018_

    * Dependencies updated

## v1.1.12 - _November 14, 2018_

    * Dependencies updated

## v1.1.11 - _November 13, 2018_

    * Dependencies updated

## v1.1.10 - _November 12, 2018_

    * Dependencies updated

## v1.1.9 - _November 9, 2018_

    * Dependencies updated

## v1.1.8 - _October 18, 2018_

    * Dependencies updated

## v1.1.7 - _October 4, 2018_

    * Dependencies updated

## v1.1.6 - _September 28, 2018_

    * Dependencies updated

## v1.1.5 - _September 25, 2018_

    * Dependencies updated

## v1.1.4 - _September 25, 2018_

    * Dependencies updated

## v1.1.3 - _September 21, 2018_

    * Dependencies updated

## v1.1.2 - _September 5, 2018_

    * Dependencies updated

## v1.1.1 - _August 27, 2018_

    * Dependencies updated

## v1.1.0 - _August 24, 2018_

    * Quicken compilation by sending multiple contracts to the same solcjs invocation, batching them together based on compiler version requirements. (#965)
    * Stop exporting types: `ContractArtifact`, `ContractNetworks` (#924)
    * Export types: `CompilerSettings`, `OutputField` (#924)

## v1.0.5 - _August 14, 2018_

    * Dependencies updated

## v1.0.4 - _July 26, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 19, 2018_

    * Dependencies updated

## v0.5.4 - _July 18, 2018_

    * Dependencies updated

## v0.5.3 - _July 9, 2018_

    * Dependencies updated

## v0.5.2 - _June 19, 2018_

    * Dependencies updated

## v0.5.1 - _May 22, 2018_

    * Make `opts` constructor parameter optional (#621)
    * Add schema validation for compiler configuration (#621)

## v0.5.0 - _May 22, 2018_

    * Properly export the executable binary (#588)
    * Add the ability to define a specific solidity version (#589)

## v0.4.3 - _May 4, 2018_

    * Dependencies updated

## v0.4.2 - _May 4, 2018_

    * Add support for solidity 0.4.23 (#545)

## v0.4.1 - _April 18, 2018_

    * Add support for solidity 0.4.22 (#531)

## v0.4.0 - _April 11, 2018_

    * Changed the config key `web3Provider` to `provider` to be consistent with other tools (#501)

## v0.3.5 - _April 2, 2018_

    * Don't try to write contract artifact if an error occured (#485)

## v0.3.4 - _April 2, 2018_

    * Create solc_bin directory if does not exist before attempting to compile (#491)

## v0.3.1 - _March 17, 2018_

    * Add TS types for `yargs`

## v0.3.0 - _March 17, 2018_

    * Add support for Solidity 0.4.20 and 0.4.21
    * Replace `jsonrpcPort` config with `jsonrpcUrl` (#426)
    * Replace `jsonrpc-port` CLI option with `jsonrpc-url` (#426)
    * Export the `Compiler` (#426)
    * Load solc from remote source instead of having it locally (#426)
    * Add `bytecode`, `runtime_bytecode`, `source_map`, `source_map_runtime` and `sources` fields to artifacts (#426)
    * Remove 0x-specific `migrate` command (#426)
    * Allow deployer to accept a provider instead of port and host. This makes it possible to run it with in-process ganache-core (#426)
    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)
    * Add `#!/usr/bin/env node` pragma above `cli.ts` script to fix command-line error.

## v0.2.0 - _March 3, 2018_

    * Check dependencies when determining if contracts should be recompiled (#408)
    * Improve an error message for when deployer is supplied with an incorrect number of constructor arguments (#419)

## v0.1.0 - _February 15, 2018_

    * Add the ability to pass in specific contracts to compile in CLI (#400)

## v0.0.8 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)
