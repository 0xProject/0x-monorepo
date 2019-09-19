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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";


library LibStakingRichErrors {

    enum StorageLayoutErrorCodes {
        UnexpectedSlot,
        UnexpectedOffset
    }

    enum OperatorShareErrorCodes {
        OperatorShareTooLarge,
        CanOnlyDecreaseOperatorShare
    }

    enum ProtocolFeePaymentErrorCodes {
        ZeroProtocolFeePaid,
        MismatchedFeeAndPayment
    }

    enum InitializationErrorCode {
        MixinSchedulerAlreadyInitialized,
        MixinParamsAlreadyInitialized
    }

    enum InvalidParamValueErrorCode {
        InvalidCobbDouglasAlpha,
        InvalidRewardDelegatedStakeWeight,
        InvalidMaximumMakersInPool,
        InvalidWethProxyAddress,
        InvalidEthVaultAddress,
        InvalidRewardVaultAddress,
        InvalidZrxVaultAddress
    }

    enum MakerPoolAssignmentErrorCodes {
        MakerAddressAlreadyRegistered,
        MakerAddressNotRegistered,
        MakerAddressNotPendingAdd,
        PoolIsFull
    }

    enum CumulativeRewardIntervalErrorCode {
        BeginEpochMustBeLessThanEndEpoch,
        BeginEpochDoesNotHaveReward,
        EndEpochDoesNotHaveReward
    }

    // bytes4(keccak256("MiscalculatedRewardsError(uint256,uint256)"))
    bytes4 internal constant MISCALCULATED_REWARDS_ERROR_SELECTOR =
        0xf7806c4e;

    // bytes4(keccak256("OnlyCallableByExchangeError(address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_EXCHANGE_ERROR_SELECTOR =
        0xb56d2df0;

    // bytes4(keccak256("ExchangeAddressAlreadyRegisteredError(address)"))
    bytes4 internal constant EXCHANGE_ADDRESS_ALREADY_REGISTERED_ERROR_SELECTOR =
        0xc87a78b7;

    // bytes4(keccak256("ExchangeAddressNotRegisteredError(address)"))
    bytes4 internal constant EXCHANGE_ADDRESS_NOT_REGISTERED_ERROR_SELECTOR =
        0x7dc025b0;

    // bytes4(keccak256("InsufficientBalanceError(uint256,uint256)"))
    bytes4 internal constant INSUFFICIENT_BALANCE_ERROR_SELECTOR =
        0x84c8b7c9;

    // bytes4(keccak256("OnlyCallableByPoolOperatorError(address,address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_POOL_OPERATOR_ERROR_SELECTOR =
        0x6cfa0c22;

    // bytes4(keccak256("OnlyCallableByPoolOperatorOrMakerError(address,address,address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_POOL_OPERATOR_OR_MAKER_ERROR_SELECTOR =
        0x7d9e1c10;

    // bytes4(keccak256("MakerPoolAssignmentError(uint8,address,bytes32)"))
    bytes4 internal constant MAKER_POOL_ASSIGNMENT_ERROR_SELECTOR =
        0x69945e3f;

    // bytes4(keccak256("WithdrawAmountExceedsMemberBalanceError(uint256,uint256)"))
    bytes4 internal constant WITHDRAW_AMOUNT_EXCEEDS_MEMBER_BALANCE_ERROR_SELECTOR =
        0xfc9c065f;

    // bytes4(keccak256("BlockTimestampTooLowError(uint256,uint256)"))
    bytes4 internal constant BLOCK_TIMESTAMP_TOO_LOW_ERROR_SELECTOR =
        0xa6bcde47;

    // bytes4(keccak256("OnlyCallableByStakingContractError(address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_STAKING_CONTRACT_ERROR_SELECTOR =
        0xca1d07a2;

    // bytes4(keccak256("OnlyCallableIfInCatastrophicFailureError()"))
    bytes internal constant ONLY_CALLABLE_IF_IN_CATASTROPHIC_FAILURE_ERROR =
        hex"3ef081cc";

    // bytes4(keccak256("OnlyCallableIfNotInCatastrophicFailureError()"))
    bytes internal constant ONLY_CALLABLE_IF_NOT_IN_CATASTROPHIC_FAILURE_ERROR =
        hex"7dd020ce";

    // bytes4(keccak256("AmountExceedsBalanceOfPoolError(uint256,uint96)"))
    bytes4 internal constant AMOUNT_EXCEEDS_BALANCE_OF_POOL_ERROR_SELECTOR =
        0x4c5c09dd;

    // bytes4(keccak256("OperatorShareError(uint8,bytes32,uint32)"))
    bytes4 internal constant OPERATOR_SHARE_ERROR_SELECTOR =
        0x22df9597;

    // bytes4(keccak256("PoolAlreadyExistsError(bytes32)"))
    bytes4 internal constant POOL_ALREADY_EXISTS_ERROR_SELECTOR =
        0x2a5e4dcf;

    // bytes4(keccak256("EthVaultNotSetError()"))
    bytes4 internal constant ETH_VAULT_NOT_SET_ERROR_SELECTOR =
        0xa067f596;

    // bytes4(keccak256("RewardVaultNotSetError()"))
    bytes4 internal constant REWARD_VAULT_NOT_SET_ERROR_SELECTOR =
        0xe6976d70;

    // bytes4(keccak256("InvalidStakeStatusError(uint256)"))
    bytes4 internal constant INVALID_STAKE_STATUS_ERROR_SELECTOR =
        0xb7161acd;

    // bytes4(keccak256("ProxyDestinationCannotBeNilError()"))
    bytes internal constant PROXY_DESTINATION_CANNOT_BE_NIL_ERROR =
        hex"6eff8285";

    // bytes4(keccak256("InitializationError(uint8)"))
    bytes4 internal constant INITIALIZATION_ERROR_SELECTOR =
        0x0b02d773;

    // bytes4(keccak256("InvalidParamValueError(uint8)"))
    bytes4 internal constant INVALID_PARAM_VALUE_ERROR_SELECTOR =
        0xfc45bd11;

    // bytes4(keccak256("InvalidProtocolFeePaymentError(uint8,uint256,uint256)"))
    bytes4 internal constant INVALID_PROTOCOL_FEE_PAYMENT_ERROR_SELECTOR =
        0xefd6cb33;

    // bytes4(keccak256("InvalidWethAssetDataError()"))
    bytes internal constant INVALID_WETH_ASSET_DATA_ERROR =
        hex"24bf322c";

    // bytes4(keccak256("CumulativeRewardIntervalError(uint8,bytes32,uint256,uint256)"))
    bytes4 internal constant CUMULATIVE_REWARD_INTERVAL_ERROR_SELECTOR =
        0x1f806d55;

    // bytes4(keccak256("StorageLayoutError(uint8,uint256,uint256)"))
    bytes4 internal constant STORAGE_LAYOUT_ERROR_SELECTOR =
        0x213eb134;

    // solhint-disable func-name-mixedcase
    function MiscalculatedRewardsError(
        uint256 totalRewardsPaid,
        uint256 initialContractBalance
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            MISCALCULATED_REWARDS_ERROR_SELECTOR,
            totalRewardsPaid,
            initialContractBalance
        );
    }

    function OnlyCallableByExchangeError(
        address senderAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ONLY_CALLABLE_BY_EXCHANGE_ERROR_SELECTOR,
            senderAddress
        );
    }

    function ExchangeAddressAlreadyRegisteredError(
        address exchangeAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            EXCHANGE_ADDRESS_ALREADY_REGISTERED_ERROR_SELECTOR,
            exchangeAddress
        );
    }

    function ExchangeAddressNotRegisteredError(
        address exchangeAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            EXCHANGE_ADDRESS_NOT_REGISTERED_ERROR_SELECTOR,
            exchangeAddress
        );
    }

    function InsufficientBalanceError(
        uint256 amount,
        uint256 balance
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INSUFFICIENT_BALANCE_ERROR_SELECTOR,
            amount,
            balance
        );
    }

    function OnlyCallableByPoolOperatorError(
        address senderAddress,
        address poolOperatorAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ONLY_CALLABLE_BY_POOL_OPERATOR_ERROR_SELECTOR,
            senderAddress,
            poolOperatorAddress
        );
    }

    function OnlyCallableByPoolOperatorOrMakerError(
        address senderAddress,
        address poolOperatorAddress,
        address makerAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ONLY_CALLABLE_BY_POOL_OPERATOR_OR_MAKER_ERROR_SELECTOR,
            senderAddress,
            poolOperatorAddress,
            makerAddress
        );
    }

    function MakerPoolAssignmentError(
        MakerPoolAssignmentErrorCodes errorCode,
        address makerAddress,
        bytes32 poolId
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            MAKER_POOL_ASSIGNMENT_ERROR_SELECTOR,
            errorCode,
            makerAddress,
            poolId
        );
    }

    function WithdrawAmountExceedsMemberBalanceError(
        uint256 withdrawAmount,
        uint256 balance
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            WITHDRAW_AMOUNT_EXCEEDS_MEMBER_BALANCE_ERROR_SELECTOR,
            withdrawAmount,
            balance
        );
    }

    function BlockTimestampTooLowError(
        uint256 epochEndTime,
        uint256 currentBlockTimestamp
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            BLOCK_TIMESTAMP_TOO_LOW_ERROR_SELECTOR,
            epochEndTime,
            currentBlockTimestamp
        );
    }

    function OnlyCallableByStakingContractError(
        address senderAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ONLY_CALLABLE_BY_STAKING_CONTRACT_ERROR_SELECTOR,
            senderAddress
        );
    }

    function OnlyCallableIfInCatastrophicFailureError()
        internal
        pure
        returns (bytes memory)
    {
        return ONLY_CALLABLE_IF_IN_CATASTROPHIC_FAILURE_ERROR;
    }

    function OnlyCallableIfNotInCatastrophicFailureError()
        internal
        pure
        returns (bytes memory)
    {
        return ONLY_CALLABLE_IF_NOT_IN_CATASTROPHIC_FAILURE_ERROR;
    }

    function AmountExceedsBalanceOfPoolError(
        uint256 amount,
        uint96 poolBalance
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            AMOUNT_EXCEEDS_BALANCE_OF_POOL_ERROR_SELECTOR,
            amount,
            poolBalance
        );
    }

    function OperatorShareError(
        OperatorShareErrorCodes errorCode,
        bytes32 poolId,
        uint32 operatorShare
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            OPERATOR_SHARE_ERROR_SELECTOR,
            errorCode,
            poolId,
            operatorShare
        );
    }

    function PoolAlreadyExistsError(
        bytes32 poolId
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            POOL_ALREADY_EXISTS_ERROR_SELECTOR,
            poolId
        );
    }

    function EthVaultNotSetError()
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ETH_VAULT_NOT_SET_ERROR_SELECTOR
        );
    }

    function RewardVaultNotSetError()
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            REWARD_VAULT_NOT_SET_ERROR_SELECTOR
        );
    }

    function InvalidProtocolFeePaymentError(
        ProtocolFeePaymentErrorCodes errorCode,
        uint256 expectedProtocolFeePaid,
        uint256 actualProtocolFeePaid
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_PROTOCOL_FEE_PAYMENT_ERROR_SELECTOR,
            errorCode,
            expectedProtocolFeePaid,
            actualProtocolFeePaid
        );
    }

    function InvalidStakeStatusError(uint256 status)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_STAKE_STATUS_ERROR_SELECTOR,
            status
        );
    }

    function InitializationError(InitializationErrorCode code)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INITIALIZATION_ERROR_SELECTOR,
            uint8(code)
        );
    }

    function InvalidParamValueError(InvalidParamValueErrorCode code)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_PARAM_VALUE_ERROR_SELECTOR,
            uint8(code)
        );
    }

    function ProxyDestinationCannotBeNilError()
        internal
        pure
        returns (bytes memory)
    {
        return PROXY_DESTINATION_CANNOT_BE_NIL_ERROR;
    }

    function InvalidWethAssetDataError()
        internal
        pure
        returns (bytes memory)
    {
        return INVALID_WETH_ASSET_DATA_ERROR;
    }

    function CumulativeRewardIntervalError(
        CumulativeRewardIntervalErrorCode errorCode,
        bytes32 poolId,
        uint256 beginEpoch,
        uint256 endEpoch
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            CUMULATIVE_REWARD_INTERVAL_ERROR_SELECTOR,
            errorCode,
            poolId,
            beginEpoch,
            endEpoch
        );
    }

    function StorageLayoutError(
        StorageLayoutErrorCodes errorCode,
        uint256 expected,
        uint256 actual
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            STORAGE_LAYOUT_ERROR_SELECTOR,
            errorCode,
            expected,
            actual
        );
    }
}
