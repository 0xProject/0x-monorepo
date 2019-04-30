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
pragma experimental ABIEncoderV2;

import "../src/interfaces/IWallet.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


contract Wallet is
    IWallet
{
    using LibBytes for bytes;

    // The owner of this wallet.
    // solhint-disable-next-line var-name-mixedcase
    address internal WALLET_OWNER;

    /// @dev constructs a new `Wallet` with a single owner.
    /// @param walletOwner The owner of this wallet.
    constructor (address walletOwner) public {
        WALLET_OWNER = walletOwner;
    }

    /// @dev Validates an EIP712 signature.
    ///      The signer must match the owner of this wallet.
    /// @param hash Message hash that is signed.
    /// @param signature Proof of signing.
    /// @return Validity of signature.
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    )
        external
        view
        returns (bool isValid)
    {
        require(
            signature.length == 65,
            "LENGTH_65_REQUIRED"
        );

        return _validateEIP712Signature(hash, signature);
    }

    /// @dev Validates an order AND EIP712 signature.
    ///      The signer must match the owner of this wallet.
    /// @param order The order.
    /// @param orderHash The order hash.
    /// @param signature Proof of signing.
    /// @return Validity of order and signature.
    function isValidOrderSignature(
        LibOrder.Order calldata order,
        bytes32 orderHash,
        bytes calldata signature
    )
        external
        view
        returns (bool isValid)
    {
        // Ensure order hash is correct.
        require(
            order.makerAddress == WALLET_OWNER,
            "INVALID_ORDER_MAKER"
        );
        return _validateEIP712Signature(orderHash, signature);
    }

    function _validateEIP712Signature(
        bytes32 hash,
        bytes memory signature
    )
        private
        view
        returns (bool isValid)
    {
        uint8 v = uint8(signature[0]);
        bytes32 r = signature.readBytes32(1);
        bytes32 s = signature.readBytes32(33);
        address recoveredAddress = ecrecover(hash, v, r, s);
        return WALLET_OWNER == recoveredAddress;
    }
}
