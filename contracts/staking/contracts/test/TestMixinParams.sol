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

import "../src/interfaces/IEthVault.sol";
import "../src/interfaces/IStakingPoolRewardVault.sol";
import "../src/sys/MixinParams.sol";


// solhint-disable no-empty-blocks
contract TestMixinParams is
    MixinParams
{

    event WETHApprove(address spender, uint256 amount);

    /// @dev Sets the eth and reward vault addresses.
    function setVaultAddresses(
        address ethVaultAddress,
        address rewardVaultAddress
    )
        external
    {
        ethVault = IEthVault(ethVaultAddress);
        rewardVault = IStakingPoolRewardVault(rewardVaultAddress);
    }

    /// @dev WETH `approve()` function that just logs events.
    function approve(address spender, uint256 amount) external returns (bool) {
        emit WETHApprove(spender, amount);
    }

    /// @dev Overridden return this contract's address.
    function _getWETHAddress() internal view returns (address) {
        return address(this);
    }
}
