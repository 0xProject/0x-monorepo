pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-staking/contracts/src/Staking.sol";


contract StakingWithTokens is
    Staking
{
    address public wethAddress;
    address public zrxVault;

    bytes4 internal constant WETH_PROXY_ID = 0xf47261b0;

    function setWethAddress(address weth)
        public
    {
        wethAddress = weth;
    }

    function setZrxVault(address vault)
        public
    {
        zrxVault = vault;
    }

    function getWethAssetData()
        public
        view
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            WETH_PROXY_ID,
            wethAddress
        );
    }

    function getWethContract()
        public
        view
        returns (IEtherToken)
    {
        return IEtherToken(wethAddress);
    }

    function getZrxVault()
        public
        view
        returns (IZrxVault)
    {
        return IZrxVault(zrxVault);
    }
}
