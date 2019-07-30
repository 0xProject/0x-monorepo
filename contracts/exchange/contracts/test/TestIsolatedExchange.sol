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
contract TestIsolatedExchange is
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

    /// @dev Raw asset balances of addresses based on asset data hash.
    ///      These start at 0 and are allowed to be negative.
    ///      Updated by `_dispatchTransferFrom()`.
    mapping(bytes32 => mapping(address => int256)) public rawAssetBalances;

    // solhint-disable no-empty-blocks
    constructor ()
        public
        Exchange(1337)
    {}

    /// @dev Convenience function to get the `rawAssetBalances` for
    ///      multiple addresses.
    function getRawAssetBalances(
        bytes calldata assetData,
        address[] calldata addresses
    )
        external
        returns (int256[] memory balances)
    {
        balances = new int256[](addresses.length);
        mapping(address => int256) storage assetBalances =
            rawAssetBalances[keccak256(assetData)];
        for (uint i = 0; i < addresses.length; i++) {
            balances[i] = assetBalances[addresses[i]];
        }
    }

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

        mapping(address => int256) storage assetBalances =
            rawAssetBalances[keccak256(assetData)];
        assetBalances[from] = _subAssetAmount(assetBalances[from], amount);
        assetBalances[to] = _addAssetAmount(assetBalances[to], amount);
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

    function _subAssetAmount(int256 a, uint256 b) private pure returns (int256 r) {
        r = a - int256(b);
        require(r <= a, "ASSET_AMOUNT_UNDERFLOW");
    }

    function _addAssetAmount(int256 a, uint256 b) private pure returns (int256 r) {
        r = a + int256(b);
        require(r >= a, "ASSET_AMOUNT_OVERFLOW");
    }
}
