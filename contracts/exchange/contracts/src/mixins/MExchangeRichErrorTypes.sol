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

import "@0x/contracts-utils/contracts/src/mixins/MRichErrorTypes.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


contract MExchangeRichErrorTypes is
    MRichErrorTypes
{
    enum FillErrorCodes {
        INVALID_TAKER_AMOUNT,
        TAKER_OVERPAY,
        OVERFILL,
        INVALID_FILL_PRICE
    }

    enum SignatureErrorCodes {
        BAD_SIGNATURE,
        INVALID_LENGTH,
        UNSUPPORTED,
        ILLEGAL,
        INAPPROPRIATE_SIGNATURE_TYPE
    }

    enum AssetProxyDispatchErrorCodes {
        INVALID_ASSET_DATA_LENGTH,
        UNKNOWN_ASSET_PROXY
    }

    enum TransactionErrorCodes {
        NO_REENTRANCY,
        ALREADY_EXECUTED,
        EXPIRED
    }

    // bytes4(keccak256("SignatureError(uint8,bytes32,address,bytes)"))
    bytes4 internal constant SIGNATURE_ERROR_SELECTOR =
        0x7e5a2318;

    // bytes4(keccak256("SignatureValidatorError(bytes32,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_VALIDATOR_ERROR_SELECTOR =
        0x169fad8c;

    // bytes4(keccak256("SignatureWalletError(bytes32,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_WALLET_ERROR_SELECTOR =
        0x1b8388f7;

    // bytes4(keccak256("SignatureOrderValidatorError(bytes32,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_ORDER_VALIDATOR_ERROR_SELECTOR =
        0xfabf4577;

    // bytes4(keccak256("SignatureWalletOrderValidatorError(bytes32,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_WALLET_ORDER_VALIDATOR_ERROR_SELECTOR =
        0xa85f3360;

    // bytes4(keccak256("OrderStatusError(bytes32,uint8)"))
    bytes4 internal constant ORDER_STATUS_ERROR_SELECTOR =
        0xfdb6ca8d;

    // bytes4(keccak256("InvalidSenderError(bytes32,address)"))
    bytes4 internal constant INVALID_SENDER_ERROR_SELECTOR =
        0x95b59997;

    // bytes4(keccak256("InvalidMakerError(bytes32,address)"))
    bytes4 internal constant INVALID_MAKER_ERROR_SELECTOR =
        0x26bf55d9;

    // bytes4(keccak256("FillError(uint8,bytes32)"))
    bytes4 internal constant FILL_ERROR_SELECTOR =
        0xe94a7ed0;

    // bytes4(keccak256("InvalidTakerError(bytes32,address)"))
    bytes4 internal constant INVALID_TAKER_ERROR_SELECTOR =
        0xfdb328be;

    // bytes4(keccak256("OrderEpochError(address,address,uint256)"))
    bytes4 internal constant ORDER_EPOCH_ERROR_SELECTOR =
        0x4ad31275;

    // bytes4(keccak256("AssetProxyExistsError(address)"))
    bytes4 internal constant ASSET_PROXY_EXISTS_ERROR_SELECTOR =
        0xcc8b3b53;

    // bytes4(keccak256("AssetProxyDispatchError(uint8,bytes32,bytes)"))
    bytes4 internal constant ASSET_PROXY_DISPATCH_ERROR_SELECTOR =
        0x488219a6;

    // bytes4(keccak256("AssetProxyTransferError(bytes32,bytes,bytes)"))
    bytes4 internal constant ASSET_PROXY_TRANSFER_ERROR_SELECTOR =
        0x4678472b;

    // bytes4(keccak256("NegativeSpreadError(bytes32,bytes32)"))
    bytes4 internal constant NEGATIVE_SPREAD_ERROR_SELECTOR =
        0xb6555d6f;

    // bytes4(keccak256("TransactionError(uint8,bytes32)"))
    bytes4 internal constant TRANSACTION_ERROR_SELECTOR =
        0xf5985184;

    // bytes4(keccak256("TransactionSignatureError(bytes32,address,bytes)"))
    bytes4 internal constant TRANSACTION_SIGNATURE_ERROR_SELECTOR =
        0xbfd56ef6;

    // bytes4(keccak256("TransactionExecutionError(bytes32,bytes)"))
    bytes4 internal constant TRANSACTION_EXECUTION_ERROR_SELECTOR =
        0x20d11f61;

    // bytes4(keccak256("IncompleteFillError(bytes32)"))
    bytes4 internal constant INCOMPLETE_FILL_ERROR_SELECTOR =
        0x152aa60e;

}
