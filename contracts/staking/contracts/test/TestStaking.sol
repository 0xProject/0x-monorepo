/*

  Copyright 2019 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-utils/contracts/src/LibFractions.sol";
import "../src/Staking.sol";
import "../src/interfaces/IStructs.sol";


contract TestStaking is
    Staking
{
    address public testWethAddress;
    address public testZrxVaultAddress;

    constructor(
        address wethAddress,
        address zrxVaultAddress
    )
        public
    {
        testWethAddress = wethAddress;
        testZrxVaultAddress = zrxVaultAddress;
    }

    /// @dev Sets the weth contract address.
    /// @param wethAddress The address of the weth contract.
    function setWethContract(address wethAddress)
        external
    {
        testWethAddress = wethAddress;
    }

    /// @dev Sets the zrx vault address.
    /// @param zrxVaultAddress The address of a zrx vault.
    function setZrxVault(address zrxVaultAddress)
        external
    {
        testZrxVaultAddress = zrxVaultAddress;
    }

    function getMostRecentCumulativeReward(bytes32 poolId)
        external
        view
        returns (IStructs.Fraction memory cumulativeRewards, uint256 lastStoredEpoch)
    {
        lastStoredEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        cumulativeRewards = _cumulativeRewardsByPool[poolId][lastStoredEpoch];
    }

    /// @dev Overridden to use testWethAddress;
    function getWethContract()
        public
        view
        returns (IEtherToken)
    {
        // `testWethAddress` will not be set on the proxy this contract is
        // attached to, so we need to access the storage of the deployed
        // instance of this contract.
        address wethAddress = TestStaking(address(uint160(stakingContract))).testWethAddress();
        return IEtherToken(wethAddress);
    }

    function getZrxVault()
        public
        view
        returns (IZrxVault zrxVault)
    {
        address zrxVaultAddress = TestStaking(address(uint160(stakingContract))).testZrxVaultAddress();
        zrxVault = IZrxVault(zrxVaultAddress);
        return zrxVault;
    }
}
