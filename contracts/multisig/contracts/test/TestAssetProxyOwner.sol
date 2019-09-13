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

import "../src/AssetProxyOwner.sol";


// solhint-disable no-empty-blocks
contract TestAssetProxyOwner is
    AssetProxyOwner
{
    constructor (
        bytes4[] memory _functionSelectors,
        address[] memory _destinations,
        uint128[] memory _functionCallTimeLockSeconds,
        address[] memory _owners,
        uint256 _required,
        uint256 _defaultSecondsTimeLocked
    )
        public
        AssetProxyOwner(
            _functionSelectors,
            _destinations,
            _functionCallTimeLockSeconds,
            _owners,
            _required,
            _defaultSecondsTimeLocked
        )
    {}
    
    function registerFunctionCallBypassWalet(
        bool hasCustomTimeLock,
        bytes4 functionSelector,
        address destination,
        uint128 newSecondsTimeLocked
    )
        external
    {
        _registerFunctionCall(
            hasCustomTimeLock,
            functionSelector,
            destination,
            newSecondsTimeLocked
        );
    }

    function assertValidFunctionCall(
        uint256 transactionConfirmationTime,
        bytes calldata data,
        address destination
    )
        external
        view
    {
        _assertValidFunctionCall(
            transactionConfirmationTime,
            data,
            destination
        );
    }
}
