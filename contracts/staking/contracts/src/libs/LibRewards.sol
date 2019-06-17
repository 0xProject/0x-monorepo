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

import "@0x/contracts-utils/contracts/src/SafeMath.sol";


contract LibRewards is SafeMath {

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
        return _safeSub(
            _safeDiv(
                _safeMul(
                    amountDelegatedByOwner,
                    _safeAdd(totalAmountOfShadowAsset, totalAmountOfRealAsset)
                ),
                totalAmountDelegated
            ),
            amountOfShadowAssetHeldByOwner
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
        internal
        pure
        returns (
            uint256 payoutInRealAsset,
            uint256 payoutInShadowAsset
        )
    {
        payoutInShadowAsset = _safeDiv(_safeMul(amountOfShadowAssetHeldByOwner, partialAmountDelegatedByOwner), amountDelegatedByOwner);
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
        return _safeDiv(
            _safeAdd( // we round up when computing shadow asset
                _safeMul(
                    amountToDelegateByOwner,
                    _safeAdd(
                        totalAmountOfShadowAsset,
                        totalAmountOfRealAsset
                    )
                ),
                _safeSub(totalAmountDelegated, 1)
            ),
            totalAmountDelegated
        );
    }


}
