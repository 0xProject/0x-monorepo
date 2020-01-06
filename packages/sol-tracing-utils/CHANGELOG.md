<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v7.0.3 - _January 6, 2020_

    * Dependencies updated

## v7.0.2 - _December 17, 2019_

    * Dependencies updated

## v7.0.1 - _December 9, 2019_

    * Dependencies updated

## v7.0.0 - _December 2, 2019_

    * Dependencies updated

## v6.1.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v6.1.0-beta.3 - _November 20, 2019_

    * Dependencies updated

## v6.1.0-beta.2 - _November 17, 2019_

    * Dependencies updated

## v6.1.0-beta.1 - _November 7, 2019_

    * Dependencies updated

## v6.1.0-beta.0 - _October 3, 2019_

    * Dependencies updated

## v6.0.19 - _September 17, 2019_

    * Dependencies updated

## v6.0.18 - _September 3, 2019_

    * Dependencies updated

## v6.0.17 - _August 22, 2019_

    * Dependencies updated

## v6.0.16 - _August 8, 2019_

    * Dependencies updated

## v6.0.15 - _July 31, 2019_

    * Dependencies updated

## v6.0.14 - _July 24, 2019_

    * Dependencies updated

## v6.0.13 - _July 13, 2019_

    * Dependencies updated

## v6.0.12 - _May 24, 2019_

    * Dependencies updated

## v6.0.11 - _May 10, 2019_

    * Dependencies updated

## v6.0.10 - _April 11, 2019_

    * Dependencies updated

## v6.0.9 - _March 21, 2019_

    * Dependencies updated

## v6.0.8 - _March 20, 2019_

    * Update solidity-parser-antlr to 0.4.2 (#1719)

## v6.0.7 - _March 1, 2019_

    * Fix a bug when `TruffleArtifactAdapter` wasn't correctly parsing solc config in pre-5.0 versions of Truffle (#1663)
    * Fix a bug when `opCodes` gas costs were incorrect or `NaN` (#1663)

## v6.0.6 - _February 27, 2019_

    * Fix a bug when `TruffleArtifactAdapter` wasn't parsing solc config in the newest version of trufle (#1654)

## v6.0.5 - _February 26, 2019_

    * Dependencies updated

## v6.0.4 - _February 25, 2019_

    * Dependencies updated

## v6.0.3 - _February 9, 2019_

    * Dependencies updated

## v6.0.2 - _February 7, 2019_

    * Dependencies updated

## v6.0.1 - _February 6, 2019_

    * Dependencies updated

## v6.0.0 - _February 5, 2019_

    * `SolCompilerArtifactAdapter` now uses `SolResolver` under the hood which allows to resolve `NPM` dependencies properly (#1535)
    * Cache the `utils.getContractDataIfExists` leading to faster execution (#1535)
    * `SolCompilerArtifactAdapter` now doesn't return the `ContractData` for interfaces (#1535)
    * Print resasonable error message on bytecode collision (#1535)
    * Fix the bug in `ASTVisitor` causing the 'cannot read property `range` of `null`' error (#1557)
    * Improve error messages when unable to find matching bytecode (#1558)
    * Fix default gas limit for fake txs in `TraceCollectionSubprovider` (#1583)
    * Fix a big when we were not intercepting `eth_sendRawTransaction` (#1584)

## v5.0.0 - _Invalid date_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v4.0.1 - _January 17, 2019_

    * Fix a bug where a custom `Geth` tracer didn't return stack entries for `DELEGATECALL` (#1521)
    * Fix a bug where `TraceCollectionSubprovider` was hanging on the fake `Geth` snapshot transaction (#1521)
    * Fix/simplify handling of revert trace snippets (#1521)

## v4.0.0 - _January 15, 2019_

    * Fix a bug with incorrect parsing of `sourceMaps` due to sources being in an array instead of a map (#1498)
    * Change the types of `ContractData.sources` and `ContractData.sourceCodes` to be objects instead of arrays (#1498)
    * Use custom JS tracer to speed up tracing on clients that support it (e.g., Geth) (#1498)
    * Log errors encountered in `TraceCollectionSubprovider` (#1498)
    * Add support for assembly statements (#1498)

## v3.0.0 - _January 11, 2019_

    * Move out specific tools and leave just the shared parts of the codebase (#1492)

## v2.1.17 - _January 9, 2019_

    * Dependencies updated

## v2.1.16 - _December 13, 2018_

    * Dependencies updated

## v2.1.15 - _December 11, 2018_

    * Dependencies updated

## v2.1.14 - _November 28, 2018_

    * Dependencies updated

## v2.1.13 - _November 21, 2018_

    * Dependencies updated

## v2.1.12 - _November 14, 2018_

    * Dependencies updated

## v2.1.11 - _November 13, 2018_

    * Dependencies updated

## v2.1.10 - _November 12, 2018_

    * Dependencies updated

## v2.1.9 - _November 9, 2018_

    * Dependencies updated

## v2.1.8 - _October 18, 2018_

    * Make @types/solidity-parser-antlr a 'dependency' so it's available to users of the library (#1105)

## v2.1.7 - _October 4, 2018_

    * Dependencies updated

## v2.1.6 - _September 28, 2018_

    * Dependencies updated

## v2.1.5 - _September 25, 2018_

    * Dependencies updated

## v2.1.4 - _September 25, 2018_

    * Dependencies updated

## v2.1.3 - _September 21, 2018_

    * Dependencies updated

## v2.1.2 - _September 5, 2018_

    * Dependencies updated

## v2.1.1 - _August 27, 2018_

    * Dependencies updated

## v2.1.0 - _August 24, 2018_

    * Export types: `JSONRPCRequestPayload`, `Provider`, `JSONRPCErrorCallback`, `JSONRPCResponsePayload`, `JSONRPCRequestPayloadWithMethod`, `NextCallback`, `ErrorCallback`, `OnNextCompleted` and `Callback` (#924)

## v2.0.0 - _August 14, 2018_

    * Fix a bug when eth_call coverage was not computed because of silent schema validation failures (#938)
    * Make `TruffleArtifactAdapter` read the `truffle.js` config for `solc` settings (#938)
    * Change the first param of `TruffleArtifactAdapter` to be the `projectRoot` instead of `sourcesDir` (#938)
    * Throw a helpful error message if truffle artifacts were generated with a different solc version than the one passed in (#938)

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 19, 2018_

    * Add artifact adapter as a parameter for `CoverageSubprovider`. Export `AbstractArtifactAdapter` (#589)
    * Implement `SolCompilerArtifactAdapter` and `TruffleArtifactAdapter` (#589)
    * Properly parse multi-level traces (#589)
    * Add support for solidity libraries (#589)
    * Fixed a bug causing `RegExp` to crash if contract code is longer that 32767 characters (#675)
    * Fixed a bug caused by Geth debug trace depth being 1indexed (#675)
    * Fixed a bug when the tool crashed on empty traces (#675)
    * Use `BlockchainLifecycle` to support reverts on Geth (#675)
    * Add `ProfilerSubprovider` as a hacky way to profile code using coverage tools (#675)
    * Collect traces from `estimate_gas` calls (#675)
    * Fix a race condition caused by not awaiting the transaction before getting a trace (#675)
    * Add `start`/`stop` functionality to `CoverageSubprovider` and `ProfilerSubprovider` (#675)
    * Skip interface artifacts with a warning instead of failing (#675)
    * Fix `solcVersion` regex in parameter validation (#690)
    * Fix a bug when in `TruffleArtifactsAdapter` causing it to throw if `compiler.json` is not there (#690)
    * HUGE perf improvements (#690)
    * Create `RevertTraceSubprovider` which prints a stack trace when a `REVERT` is detected (#705)
    * Add source code snippets to stack traces printed by `RevertTraceSubprovider` (#725)

## v0.1.3 - _July 18, 2018_

    * Dependencies updated

## v0.1.2 - _July 9, 2018_

    * Dependencies updated

## v0.1.1 - _June 19, 2018_

    * Dependencies updated

## v0.1.0 - _May 31, 2018_

    * Incorrect publish that was unpublished

## v0.0.11 - _May 22, 2018_

    * Dependencies updated

## v0.0.10 - _May 4, 2018_

    * Dependencies updated

## v0.0.9 - _May 4, 2018_

    * Dependencies updated

## v0.0.8 - _April 18, 2018_

    * Dependencies updated

## v0.0.7 - _April 11, 2018_

    * Dependencies updated

## v0.0.6 - _April 2, 2018_

    * Dependencies updated

## v0.0.5 - _April 2, 2018_

    * Dependencies updated
