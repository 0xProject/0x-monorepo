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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


// This should probably be moved to contracts-exchange-lib
contract MRichErrors
{
    // solhint-disable func-name-mixedcase
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
        WALLET_ERROR,
        VALIDATOR_ERROR
    }

    enum AssetProxyDispatchErrorCodes {
        INVALID_ASSET_DATA_LENGTH,
        UNKNOWN_ASSET_PROXY
    }

    enum TransactionExecutionErrorCodes {
        NO_REENTRANCY,
        ALREADY_EXECUTED,
        BAD_SIGNATURE,
        FAILED_EXECUTION
    }

    bytes4 private constant STANDARD_ERROR_SELECTOR =
        bytes4(keccak256("Error(string)"));

    function StandardError(
        string memory message
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodePacked(
            STANDARD_ERROR_SELECTOR,
            uint256(0x20),
            bytes(message).length,
            bytes(message)
        );
    }

    bytes4 private constant SIGNATURE_ERROR_SELECTOR =
        bytes4(keccak256("SignatureError(bytes32,uint8)"));

    function SignatureError(
        bytes32 orderHash,
        SignatureErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_ERROR_SELECTOR,
            orderHash,
            error
        );
    }

    bytes4 private constant ORDER_STATUS_ERROR_SELECTOR =
        bytes4(keccak256("OrderStatusError(bytes32,uint8)"));

    function OrderStatusError(
        bytes32 orderHash,
        LibOrder.OrderStatus orderStatus
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ORDER_STATUS_ERROR_SELECTOR,
            orderHash,
            uint8(orderStatus)
        );
    }

    bytes4 private constant INVALID_SENDER_ERROR_SELECTOR =
        bytes4(keccak256("InvalidSenderError(bytes32,address)"));

    function InvalidSenderError(
        bytes32 orderHash,
        address sender
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_SENDER_ERROR_SELECTOR,
            orderHash,
            sender
        );
    }

    bytes4 private constant INVALID_MAKER_ERROR_SELECTOR =
        bytes4(keccak256("InvalidMakerError(bytes32,address)"));

    function InvalidMakerError(
        bytes32 orderHash,
        address maker
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_MAKER_ERROR_SELECTOR,
            orderHash,
            maker
        );
    }

    bytes4 private constant FILL_ERROR_SELECTOR =
        bytes4(keccak256("FillError(bytes32,uint8)"));

    function FillError(
        bytes32 orderHash,
        FillErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            FILL_ERROR_SELECTOR,
            orderHash,
            uint8(error)
        );
    }

    bytes4 private constant INVALID_TAKER_ERROR_SELECTOR =
        bytes4(keccak256("InvalidTakerError(bytes32,address)"));

    function InvalidTakerError(
        bytes32 orderHash,
        address taker
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_TAKER_ERROR_SELECTOR,
            orderHash,
            taker
        );
    }

    bytes4 private constant EPOCH_ORDER_ERROR_SELECTOR =
        bytes4(keccak256("EpochOrderError(address,address,uint256)"));

    function EpochOrderError(
        address maker,
        address sender,
        uint256 currentEpoch
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            EPOCH_ORDER_ERROR_SELECTOR,
            maker,
            sender,
            currentEpoch
        );
    }

    bytes4 private constant ASSET_PROXY_EXISTS_ERROR_SELECTOR =
        bytes4(keccak256("AssetProxyExistsError(address)"));

    function AssetProxyExistsError(
        address proxy
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_EXISTS_ERROR_SELECTOR,
            proxy
        );
    }

    bytes4 private constant ASSET_PROXY_DISPATCH_ERROR_SELECTOR =
        bytes4(keccak256("AssetProxyDispatchError(uint8)"));

    function AssetProxyDispatchError(
        AssetProxyDispatchErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ASSET_PROXY_DISPATCH_ERROR_SELECTOR,
            uint8(error)
        );
    }

    bytes4 private constant NEGATIVE_SPREAD_ERROR =
        bytes4(keccak256("NegativeSpreadError(bytes32,bytes32)"));

    function NegativeSpreadError(
        bytes32 leftOrderHash,
        bytes32 rightOrderHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            NEGATIVE_SPREAD_ERROR,
            leftOrderHash,
            rightOrderHash
        );
    }

    bytes4 private constant TRANSACTION_EXECUTION_ERROR =
        bytes4(keccak256("TransactionExecutionError(uint8)"));

    function TransactionExecutionError(
        TransactionExecutionErrorCodes error
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            TRANSACTION_EXECUTION_ERROR,
            error
        );
    }

    bytes4 private constant INCOMPLETE_FILL_ERROR =
        bytes4(keccak256("IncompleteFillError(bytes32)"));

    function IncompleteFillError(
        bytes32 orderHash
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INCOMPLETE_FILL_ERROR,
            orderHash
        );
    }
    // solhint-enable func-name-mixedcase

    /// @dev Reverts an encoded rich revert reason `errorData`.
    /// Use any of the *Error functions defined in this contract to
    /// generate a rich revert reason.
    /// Evaluating the testg condition in an if block then calling this
    /// may be preferable (gas-wise) to rrequire()
    /// since you can avoid the needless abi encoding if the test passes.
    /// @param errorData ABI encoded error data.
    function rrevert(bytes memory errorData)
        internal
        pure
    {
        assembly {
            revert(add(errorData, 0x20), mload(errorData))
        }
    }

    /// @dev Reverts with a encoded rich revert reason `errorData` if `success` is false.
    /// This is designed to be analagous to the built-in require() function.
    /// Use any of the *Error functions defined in this contract to
    /// generate a rich revert reason.
    /// @param success If false, reverts with the payload in errorData.
    /// @param errorData ABI encoded error data.
    function rrequire(
        bool success,
        bytes memory errorData
    )
        internal
        pure
    {
        assembly {
            if iszero(and(success, 0x00000000000000000000000000000000000000000000000000000000000000FF)) {
                revert(add(errorData, 0x20), mload(errorData))
            }
        }
    }
}
