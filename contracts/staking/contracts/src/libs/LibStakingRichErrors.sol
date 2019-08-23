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
    // bytes4(keccak256("MiscalculatedRewardsError(uint256,uint256)"))
    bytes4 internal constant MISCALCULATED_REWARDS_ERROR_SELECTOR = 
        0xf7806c4e;
    
    // bytes4(keccak256("OnlyCallableByExchangeError(address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_EXCHANGE_ERROR_SELECTOR = 
        0xb56d2df0;
    
    // bytes4(keccak256("ExchangeAlreadyRegisteredError(address)"))
    bytes4 internal constant EXCHANGE_ALREADY_REGISTERED_ERROR_SELECTOR = 
        0x5ef5b57d;
    
    // bytes4(keccak256("ExchangeAddressNotRegisteredError(address)"))
    bytes4 internal constant EXCHANGE_ADDRESS_NOT_REGISTERED_ERROR_SELECTOR = 
        0x7dc025b0;
    
    // bytes4(keccak256("SignatureLengthGreaterThan0RequiredError()"))
    bytes4 internal constant SIGNATURE_LENGTH_GREATER_THAN_0_REQUIRED_ERROR_SELECTOR = 
        0x2dcb01d9;
    
    // bytes4(keccak256("SignatureUnsupportedError(bytes)"))
    bytes4 internal constant SIGNATURE_UNSUPPORTED_ERROR_SELECTOR = 
        0xffca2a70;
    
    // bytes4(keccak256("SignatureIllegalError(bytes)"))
    bytes4 internal constant SIGNATURE_ILLEGAL_ERROR_SELECTOR = 
        0x4a95093c;
    
    // bytes4(keccak256("SignatureLength0RequiredError(bytes)"))
    bytes4 internal constant SIGNATURE_LENGTH_0_REQUIRED_ERROR_SELECTOR = 
        0xcbcd59a2;
    
    // bytes4(keccak256("SignatureLength65RequiredError(bytes)"))
    bytes4 internal constant SIGNATURE_LENGTH_65_REQUIRED_ERROR_SELECTOR = 
        0x091d7ab9;
    
    // bytes4(keccak256("WalletError(address,bytes)"))
    bytes4 internal constant WALLET_ERROR_SELECTOR = 
        0x0cfc935d;
    
    // bytes4(keccak256("InsufficientBalanceError(uint256,uint256)"))
    bytes4 internal constant INSUFFICIENT_BALANCE_ERROR_SELECTOR = 
        0x84c8b7c9;
    
    // bytes4(keccak256("OnlyCallableByPoolOperatorError(address,address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_POOL_OPERATOR_ERROR_SELECTOR = 
        0x6cfa0c22;
    
    // bytes4(keccak256("OnlyCallableByPoolOperatorOrMakerError(address,address,address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_POOL_OPERATOR_OR_MAKER_ERROR_SELECTOR = 
        0x7d9e1c10;
    
    // bytes4(keccak256("InvalidMakerSignatureError(bytes32,address,bytes)"))
    bytes4 internal constant INVALID_MAKER_SIGNATURE_ERROR_SELECTOR = 
        0x726b89c8;
    
    // bytes4(keccak256("MakerAddressAlreadyRegisteredError(address)"))
    bytes4 internal constant MAKER_ADDRESS_ALREADY_REGISTERED_ERROR_SELECTOR = 
        0x5a3971da;
    
    // bytes4(keccak256("MakerAddressNotRegisteredError(address,bytes32,bytes32)"))
    bytes4 internal constant MAKER_ADDRESS_NOT_REGISTERED_ERROR_SELECTOR = 
        0x12ab07e8;
    
    // bytes4(keccak256("WithdrawAmountExceedsMemberBalanceError(uint256,uint256)"))
    bytes4 internal constant WITHDRAW_AMOUNT_EXCEEDS_MEMBER_BALANCE_ERROR_SELECTOR = 
        0xfc9c065f;
    
    // bytes4(keccak256("BlockTimestampTooLowError(uint64,uint64)"))
    bytes4 internal constant BLOCK_TIMESTAMP_TOO_LOW_ERROR_SELECTOR = 
        0x887225f7;
    
    // bytes4(keccak256("OnlyCallableByStakingContractError(address)"))
    bytes4 internal constant ONLY_CALLABLE_BY_STAKING_CONTRACT_ERROR_SELECTOR = 
        0xca1d07a2;
    
    // bytes4(keccak256("OnlyCallableInCatastrophicFailureError()"))
    bytes4 internal constant ONLY_CALLABLE_IN_CATASTROPHIC_FAILURE_ERROR_SELECTOR = 
        0xa4f5de9d;
    
    // bytes4(keccak256("OnlyCallableNotInCatastrophicFailureError()"))
    bytes4 internal constant ONLY_CALLABLE_NOT_IN_CATASTROPHIC_FAILURE_ERROR_SELECTOR = 
        0x7e8d2ed9;
    
    // bytes4(keccak256("AmountExceedsBalanceOfPoolError(uint256,uint96)"))
    bytes4 internal constant AMOUNT_EXCEEDS_BALANCE_OF_POOL_ERROR_SELECTOR = 
        0x4c5c09dd;
    
    // bytes4(keccak256("OperatorShareMustBeBetween0And100Error(bytes32,uint8)"))
    bytes4 internal constant OPERATOR_SHARE_MUST_BE_BETWEEN_0_AND_100_ERROR_SELECTOR = 
        0xde447684;
    
    // bytes4(keccak256("PoolAlreadyExistsError(bytes32)"))
    bytes4 internal constant POOL_ALREADY_EXISTS_ERROR_SELECTOR = 
        0x2a5e4dcf;
    
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
    
    function ExchangeAlreadyRegisteredError(
        address exchangeAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            EXCHANGE_ALREADY_REGISTERED_ERROR_SELECTOR,
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
    
    function SignatureLengthGreaterThan0RequiredError()
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(SIGNATURE_LENGTH_GREATER_THAN_0_REQUIRED_ERROR_SELECTOR);
    }
    
    function SignatureUnsupportedError(
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_UNSUPPORTED_ERROR_SELECTOR,
            signature
        );
    }
    
    function SignatureIllegalError(
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_ILLEGAL_ERROR_SELECTOR,
            signature
        );
    }
    
    function SignatureLength0RequiredError(
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_LENGTH_0_REQUIRED_ERROR_SELECTOR,
            signature
        );
    }
    
    function SignatureLength65RequiredError(
        bytes memory signature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            SIGNATURE_LENGTH_65_REQUIRED_ERROR_SELECTOR,
            signature
        );
    }
    
    function WalletError(
        address walletAddress,
        bytes memory errorData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            WALLET_ERROR_SELECTOR,
            walletAddress,
            errorData
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
    
    function InvalidMakerSignatureError(
        bytes32 poolId,
        address makerAddress,
        bytes memory makerSignature
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            INVALID_MAKER_SIGNATURE_ERROR_SELECTOR,
            poolId,
            makerAddress,
            makerSignature
        );
    }
    
    function MakerAddressAlreadyRegisteredError(
        address makerAddress
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            MAKER_ADDRESS_ALREADY_REGISTERED_ERROR_SELECTOR,
            makerAddress
        );
    }
    
    function MakerAddressNotRegisteredError(
        address makerAddress,
        bytes32 makerPoolId,
        bytes32 poolId
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            MAKER_ADDRESS_NOT_REGISTERED_ERROR_SELECTOR,
            makerAddress,
            makerPoolId,
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
        uint64 epochEndTime,
        uint64 currentBlockTimestamp
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
    
    function OnlyCallableInCatastrophicFailureError()
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(ONLY_CALLABLE_IN_CATASTROPHIC_FAILURE_ERROR_SELECTOR);
    }
    
    function OnlyCallableNotInCatastrophicFailureError()
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(ONLY_CALLABLE_NOT_IN_CATASTROPHIC_FAILURE_ERROR_SELECTOR);
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
    
    function OperatorShareMustBeBetween0And100Error(
        bytes32 poolId,
        uint8 poolOperatorShare
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            OPERATOR_SHARE_MUST_BE_BETWEEN_0_AND_100_ERROR_SELECTOR,
            poolId,
            poolOperatorShare
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
}