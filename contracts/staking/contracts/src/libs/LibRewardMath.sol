/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.5.5;

import "./LibSafeMath.sol";


/// @dev This library contains logic for computing the reward balances of staking pool members.
/// *** READ MixinStakingPoolRewards BEFORE CONTINUING ***
library LibRewardMath {

    using LibSafeMath for uint256;

    /// @dev Computes a member's payout denominated in the real asset (ETH).
    /// Use this function when a member is liquidating their position in the pool (undelegating all their stake);
    /// their shadow balance must be reset to zero so there is no need to compute it here.
    /// @param amountDelegatedByOwner Amount of Stake delegated by the member to the staking pool.
    /// @param totalAmountDelegated Total amount of Stake delegated by all members of the staking pool.
    /// @param amountOfShadowAssetHeldByOwner The shadow balance of the member.
    /// @param totalAmountOfShadowAsset The sum total of shadow balances across all members of the pool.
    /// @param totalAmountOfRealAsset The total amount of ETH shared by members of the pool.
    function _computePayoutDenominatedInRealAsset(
        uint256 amountDelegatedByOwner,
        uint256 totalAmountDelegated,
        uint256 amountOfShadowAssetHeldByOwner,
        uint256 totalAmountOfShadowAsset,
        uint256 totalAmountOfRealAsset
    )
        internal
        pure
        returns (uint256)
    {
        uint256 combinedPayout = amountDelegatedByOwner
            ._mul(totalAmountOfShadowAsset._add(totalAmountOfRealAsset))
            ._div(totalAmountDelegated);

        // we round up the amount of shadow assets when computing buy-ins.
        // the result is that sometimes the amount of actual assets in the pool
        // is less than the shadow eth. in this case, we'll end up with a floating imbalance.
        uint256 payoutInRealAsset = combinedPayout < amountOfShadowAssetHeldByOwner ?
            0 :
            combinedPayout - amountOfShadowAssetHeldByOwner;

        return payoutInRealAsset;
    }

    /// @dev Computes a member's payout denominated in the real asset (ETH).
    /// Use this function when a member is undelegating a portion (but not all) of their stake.
    /// @param partialAmountDelegatedByOwner Amount of Stake being undelegated by the member to the staking pool.
    /// @param amountDelegatedByOwner Amount of Stake delegated by the member to the staking pool.
    ///                               This includes `partialAmountDelegatedByOwner`.
    /// @param totalAmountDelegated Total amount of Stake delegated by all members of the staking pool.
    /// @param amountOfShadowAssetHeldByOwner The shadow balance of the member.
    /// @param totalAmountOfShadowAsset The sum total of shadow balances across all members of the pool.
    /// @param totalAmountOfRealAsset The total amount of ETH shared by members of the pool.
    function _computePartialPayout(
        uint256 partialAmountDelegatedByOwner,
        uint256 amountDelegatedByOwner,
        uint256 totalAmountDelegated,
        uint256 amountOfShadowAssetHeldByOwner,
        uint256 totalAmountOfShadowAsset,
        uint256 totalAmountOfRealAsset
    )
        internal
        pure
        returns (
            uint256 payoutInRealAsset,
            uint256 payoutInShadowAsset
        )
    {
        payoutInShadowAsset = amountOfShadowAssetHeldByOwner
            ._mul(partialAmountDelegatedByOwner)
            ._div(amountDelegatedByOwner);

        payoutInRealAsset = _computePayoutDenominatedInRealAsset(
            partialAmountDelegatedByOwner,
            totalAmountDelegated,
            payoutInShadowAsset,
            totalAmountOfShadowAsset,
            totalAmountOfRealAsset
        );
        return (payoutInRealAsset, payoutInShadowAsset);
    }

    /// @dev Computes how much shadow asset to mint a member who wants to 
    /// join (or delegate more stake to) a staking pool.
    /// See MixinStakingPoolRewards for more information on shadow assets.
    /// @param amountToDelegateByOwner Amount of Stake the new member would delegate.
    /// @param totalAmountDelegated Total amount currently delegated to the pool.
    ///                             This does *not* include `amountToDelegateByOwner`.
    /// @param totalAmountOfShadowAsset The sum total of shadow balances across all members of the pool.
    /// @param totalAmountOfRealAsset The total amount of ETH shared by members of the pool.
    function _computeBuyInDenominatedInShadowAsset(
        uint256 amountToDelegateByOwner,
        uint256 totalAmountDelegated,
        uint256 totalAmountOfShadowAsset,
        uint256 totalAmountOfRealAsset
    )
        internal
        pure
        returns (uint256)
    {
        if (totalAmountDelegated == 0) {
            return 0;
        }
        return amountToDelegateByOwner
            ._mul(totalAmountOfShadowAsset._add(totalAmountOfRealAsset))
            ._add(totalAmountDelegated._sub(1)) // we round up when computing shadow asset
            ._div(totalAmountDelegated);
    }
}
