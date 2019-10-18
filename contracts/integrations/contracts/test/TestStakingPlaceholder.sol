pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-staking/contracts/test/TestStaking.sol";


// TODO(jalextowle): This contract can be removed when the added to this package.
contract TestStakingPlaceholder is
    TestStaking
{
    constructor(address wethAddress, address zrxVaultAddress)
        public
        TestStaking(wethAddress, zrxVaultAddress)
    {} // solhint-disable-line no-empty-blocks
}
