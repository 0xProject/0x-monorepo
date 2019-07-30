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

import "../src/Exchange.sol";


/// @dev A version of the Exchange contract with simplified signature validation
///      and a `_dispatchTransferFrom()` that only logs arguments.
contract TestExchangeIsolated is
    Exchange
{
    // solhint-disable no-unused-vars
    event DispatchTransferFromCalled(
        bytes32 orderHash,
        bytes assetData,
        address from,
        address to,
        uint256 amount
    );

    /// @dev Raw asset balance changes of addresses based by asset data hash.
    ///      Updated by `_dispatchTransferFrom()`.
    mapping(bytes32 => mapping(address => int256)) public rawAssetBalanceChanges;

    // solhint-disable no-empty-blocks
    constructor ()
        public
        Exchange(1337)
    {}

    /// @dev Overriden to only log arguments and track raw asset balances.
    function _dispatchTransferFrom(
        bytes32 orderHash,
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        emit DispatchTransferFromCalled(
            orderHash,
            assetData,
            from,
            to,
            amount
        );

        mapping(address => int256) storage balances =
            rawAssetBalanceChanges[keccak256(assetData)];
        balances[from] -= int256(amount);
        balances[to] += int256(amount);
    }

    /// @dev Overriden to simplify signature validation.
    ///      Unfortunately, this is `view`, so it can't log arguments.
    function _isValidOrderWithHashSignature(
        Order memory order,
        bytes32 orderHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        // '0x01' in the first byte is valid.
        return signature.length == 2 && signature[0] == 0x01;
    }
}
