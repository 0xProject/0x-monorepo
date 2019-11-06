<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v1.1.0-beta.0 - _October 3, 2019_

    * Created package (#1821)
    * First implementation (#1910)
    * Replace `LibFeeMath` with `LibFixedMath`. (#2109)
    * Use a more precise cobb-douglas implementation. (#2109)
    * Change the way operator stake is computed. (#2109)
    * Denominate pool operator shares in parts-per-million. (#2109)
    * New stake management mechanics. Delay before delegation. Nixed shadow rewards. (#2118)
    * Tests for new stake management mechanics. (#2126)
    * Add `init()` pattern to contracts. (#2131)
    * Replace `MixinDeploymentConstants` with `MixinParams`. (#2131)
    * Reference counting for cumulative rewards. (#2154)
    * Refactored Staking Reward Vault. Moved pool management logic into staking contract. (#2156)
    * Removed MixinStakingPoolRewardVault.sol (#2156)
    * Refactored out `_cobbDouglas()` into its own library (#2179)
    * Introduce multi-block finalization. (#2155)
    * Removed reference counting for cumulative rewards. (#2188)
    * Removed explicit dependency on epoch+1 when delegating. (#2188)
