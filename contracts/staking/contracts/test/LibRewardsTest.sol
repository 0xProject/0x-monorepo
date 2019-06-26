

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

import "../src/libs/LibRewards.sol";


contract LibRewardsTest {

    function _computePayoutDenominatedInRealAsset(
        uint256 amountDelegatedByOwner,
        uint256 totalAmountDelegated,
        uint256 amountOfShadowAssetHeldByOwner,
        uint256 totalAmountOfShadowAsset,
        uint256 totalAmountOfRealAsset
    )
        external
        returns (uint256)
    {
        return LibRewards._computePayoutDenominatedInRealAsset(
            amountDelegatedByOwner,
            totalAmountDelegated,
            amountOfShadowAssetHeldByOwner,
            totalAmountOfShadowAsset,
            totalAmountOfRealAsset
        );
    }

    function _computePartialPayout(
        uint256 partialAmountDelegatedByOwner,
        uint256 amountDelegatedByOwner,
        uint256 totalAmountDelegated,
        uint256 amountOfShadowAssetHeldByOwner,
        uint256 totalAmountOfShadowAsset,
        uint256 totalAmountOfRealAsset
    )
        external
        returns (
            uint256 payoutInRealAsset,
            uint256 payoutInShadowAsset
        )
    {
        return LibRewards._computePartialPayout(
            partialAmountDelegatedByOwner,
            amountDelegatedByOwner,
            totalAmountDelegated,
            amountOfShadowAssetHeldByOwner,
            totalAmountOfShadowAsset,
            totalAmountOfRealAsset
        );
    }

    function _computeBuyInDenominatedInShadowAsset(
        uint256 amountToDelegateByOwner,
        uint256 totalAmountDelegated,
        uint256 totalAmountOfShadowAsset,
        uint256 totalAmountOfRealAsset
    )
        external
        returns (uint256)
    {
        return LibRewards._computeBuyInDenominatedInShadowAsset(
            amountToDelegateByOwner,
            totalAmountDelegated,
            totalAmountOfShadowAsset,
            totalAmountOfRealAsset
        );
    }
}
