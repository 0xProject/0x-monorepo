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


library LibRewardMath {

    using LibSafeMath for uint256;

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
