<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 20, 2018_

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

## v0.1.0 - _June 1, 2018_

    * Incorrect publish that was unpublished

## v0.0.11 - _May 22, 2018_

    * Dependencies updated

## v0.0.10 - _May 5, 2018_

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
