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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "../../src/interfaces/IWallet.sol";


contract OrderScenarioWallet is
    IWallet
{
    mapping(bytes32=>bool) public isHashBlacklisted;

    /// @dev Toggle whether signature validation should fail a hash.
    function enableValidSignature(
        bytes32 hash,
        bool isValid
    )
        external
        returns (void)
    {
        isHashBlacklisted[hash] = isValid;
    }

    /// @dev Call a function on another contract from the context of
    ///      this wallet.
    /// @param targetAddress The address of the target contract.
    /// @param callData The ABI-encoded function call.
    function callExternalFunction(
        address targetAddress,
        bytes calldata callData
    )
        external
        returns (bool didSucceed, bytes memory returnData)
    {
        (didSucceed, returnData) = targetAddress.call(callData);
    }

    /// @dev `Wallet` signature type validation callback.
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    )
        external
        pure
        returns (bool isValid)
    {
        return !isHashBlacklisted[hash];
    }
}
