pragma solidity ^0.5.9;

import "@0x/contracts-staking/contracts/staking/Staking.sol";


contract StakingWithTokens is
    Staking
{
    address public wethAddress;
    address public zrxAddress;
    address public zrxVault;

    // FIXME - Overide the getters from deployment constants and add setters.
}
