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

import "@0x/contracts-utils/contracts/src/LibEIP1271.sol";


contract TestSignatureValidationWallet is
    LibEIP1271
{
    bytes4 private constant LEGACY_WALLET_MAGIC_VALUE = 0xb0671381;

    // Callback used by `EIP1271Wallet` and `Validator` signature types.
    function isValidSignature(
        bytes memory,
        bytes memory
    )
        public
        pure
        returns (bytes4 magicValue)
    {
        return EIP1271_MAGIC_VALUE;
    }

    // Callback used by `Wallet` signature type.
    function isValidSignature(
        bytes32,
        bytes memory
    )
        public
        pure
        returns (bytes4 magicValue)
    {
        return LEGACY_WALLET_MAGIC_VALUE;
    }
}
