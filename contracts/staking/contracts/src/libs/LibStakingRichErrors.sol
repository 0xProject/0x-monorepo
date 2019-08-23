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
    function MiscalculatedRewardsError(
        uint256 totalRewardsPaid,
        uint256 initialContractBalance
    ) {}

    function OnlyCallableByExchangeError(
        address senderAddress
    ) {}

    function ExchangeAlreadyRegisteredError(
        address exchangeAddress
    ) {}

    function ExchangeAddressNotRegisteredError(
        address exchangeAddress
    ) {}

    function SignatureLengthGreaterThan0RequiredError() {}

    function SignatureUnsupportedError(
        bytes memory signature
    ) {}

    function SignatureIllegalError(
        bytes memory signature
    ) {}

    function SignatureLength0RequiredError(
        bytes memory signature
    ) {}

    function SignatureLength65RequiredError(
        bytes memory signature
    ) {}

    function WalletError(
        address walletAddress,
        bytes memory errorData
    ) {}

    function InsufficientBalanceError(
        uint256 amount,
        uint256 balance
    ) {}

    function OnlyCallableByPoolOperatorError(
        address senderAddress,
        address poolOperatorAddress
    ) {}

    function OnlyCallableByPoolOperatorOrMakerError(
        address senderAddress,
        address poolOperatorAddress,
        address makerAddress
    ) {}

    function InvalidMakerSignatureError(
        bytes32 poolId,
        address makerAddress,
        bytes memory makerSignature
    ) {}

    function MakerAddressAlreadyRegisteredError(
        address makerAddress
    ) {}

    function MakerAddressNotRegisteredError(
        address makerAddress,
        bytes32 makerPoolId,
        bytes32 poolId
    ) {}

    function WithdrawAmountExceedsMemberBalanceError(
        uint256 withdrawAmount,
        uint256 balance
    ) {}

    function BlockTimestampTooLowError(
        uint64 epochEndTime,
        uint64 currentBlockTimestamp
    ) {}

    function OnlyCallableByStakingContractError(
        address senderAddress
    ) {}

    function OnlyCallableInCatastrophicFailureError() {}

    function OnlyCallableNotInCatastrophicFailureError() {}

    function AmountExceedsBalanceOfPoolError(
        uint256 amount,
        uint96 poolBalance
    ) {}

    function OperatorShareMustBeBetween0And100Error(
        bytes32 poolId,
        uint8 poolOperatorShare
    ) {}

    function PoolAlreadyExistsError(
        bytes32 poolId
    ) {}
}
