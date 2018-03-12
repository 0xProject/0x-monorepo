# CHANGELOG

## v0.3.0 - _TBD, 2018_

    * Add support for Solidity 0.4.20 and 0.4.21
    * Replace `jsonrpcPort` config by `jsonrpcUrl` (#426)
    * Replace `jsonrpc-port` CLI option by `jsonrpc-url` (#426)

## v0.2.0 - _March 4, 2018_

    * Check dependencies when determining if contracts should be recompiled (#408)
    * Improve an error message for when deployer is supplied with an incorrect number of constructor arguments (#419)
    * Export the `Compiler` (#426)
    * Load solc from remote source instead of having it locally (#426)
    * Add `bytecode`, `runtime_bytecode`, `source_map`, `source_map_runtime` and `sources` fields to artifacts (#426)
    * Remove 0x-specific `migrate` command (#426)
    * Allow deployer to accept a provider instead of port and host. This makes it possible to run it with in-process ganache-core (#426)

## v0.1.0 - _February 16, 2018_

    * Add the ability to pass in specific contracts to compile in CLI (#400)

## v0.0.8 - _February 9, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)
