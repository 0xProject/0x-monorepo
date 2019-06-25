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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";


contract MixinCommon {
    // Defined in MixinSignatureValidator
    function _isValidOrderWithHashSignature(
        LibOrder.Order memory order,
        bytes32 orderHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid);

    // Defined in MixinSignatureValidator
    function _isValidTransactionWithHashSignature(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes32 transactionHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid);

    // Defined in MixinSignatureValidator
    function doesSignatureRequireRegularValidation(
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        public
        pure
        returns (bool needsRegularValidation);

    // Defined in MixinTransactions
    function _getCurrentContextAddress()
        internal
        view
        returns (address);
}
