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

import "@0x/contracts-utils/contracts/src/mixins/MRichErrors.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "./MExchangeRichErrorTypes.sol";


contract MExchangeRichErrors is
    MExchangeRichErrorTypes,
    MRichErrors
{
    // solhint-disable func-name-mixedcase
    function SignatureError(
        SignatureErrorCodes errorCode,
        bytes32 hash,
        address signerAddress,
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory);

    function SignatureValidatorError(
        bytes32 hash,
        address signerAddress,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory);

    function SignatureWalletError(
        bytes32 hash,
        address signerAddress,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory);

    function SignatureOrderValidatorError(
        bytes32 orderHash,
        address signerAddress,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory);

    function SignatureWalletOrderValidatorError(
        bytes32 orderHash,
        address wallet,
        bytes memory signature,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory);

    function OrderStatusError(
        bytes32 orderHash,
        LibOrder.OrderStatus orderStatus
    )
        internal
        pure
        returns (bytes memory);

    function InvalidSenderError(
        bytes32 orderHash,
        address senderAddress
    )
        internal
        pure
        returns (bytes memory);

    function InvalidMakerError(
        bytes32 orderHash,
        address makerAddress
    )
        internal
        pure
        returns (bytes memory);

    function FillError(
        FillErrorCodes errorCode,
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory);

    function InvalidTakerError(
        bytes32 orderHash,
        address takerAddress
    )
        internal
        pure
        returns (bytes memory);

    function OrderEpochError(
        address makerAddress,
        address senderAddress,
        uint256 currentEpoch
    )
        internal
        pure
        returns (bytes memory);

    function AssetProxyExistsError(
        address proxyAddress
    )
        internal
        pure
        returns (bytes memory);

    function AssetProxyDispatchError(
        AssetProxyDispatchErrorCodes errorCode,
        bytes32 orderHash,
        bytes memory assetData
    )
        internal
        pure
        returns (bytes memory);

    function AssetProxyTransferError(
        bytes32 orderHash,
        bytes memory assetData,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory);

    function NegativeSpreadError(
        bytes32 leftOrderHash,
        bytes32 rightOrderHash
    )
        internal
        pure
        returns (bytes memory);

    function TransactionError(
        TransactionErrorCodes errorCode,
        bytes32 transactionHash
    )
        internal
        pure
        returns (bytes memory);

    function TransactionSignatureError(
        bytes32 transactionHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory);

    function TransactionExecutionError(
        bytes32 transactionHash,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory);

    function IncompleteFillError(
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory);
}
