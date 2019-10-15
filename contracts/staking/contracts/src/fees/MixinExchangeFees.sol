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
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../interfaces/IStructs.sol";
import "./MixinExchangeFeeStats.sol";
import "./MixinExchangeManager.sol";


contract MixinExchangeFees is
    MixinExchangeManager,
    MixinExchangeFeeStats
{
    using LibSafeMath for uint256;

    /// @dev Pays a protocol fee in ETH or WETH.
    ///      Only a known 0x exchange can call this method. See
    ///      (MixinExchangeManager).
    /// @param makerAddress The address of the order's maker.
    /// @param payerAddress The address of the protocol fee payer.
    /// @param protocolFeePaid The protocol fee that should be paid.
    function payProtocolFee(
        address makerAddress,
        address payerAddress,
        uint256 protocolFeePaid
    )
        external
        payable
        onlyExchange
    {
        // Sanity check on protocol fee.
        _assertValidProtocolFee(protocolFeePaid);

        // If no value was sent then collect the fee in WETH.
        if (msg.value == 0) {
            require(
                getWethContract().transferFrom(
                    payerAddress,
                    address(this),
                    protocolFeePaid
                ),
                "WETH_TRANSFER_FAILED"
            );
        }

        // Attribute protocol fee to maker's pool.
        _attributeFeeToPool(
            poolIdByMaker[makerAddress],
            protocolFeePaid
        );
    }

    function _endProtocolFeePeriod(uint256 epoch)
        internal
    {
        // Convert all ETH to WETH and record the total rewards available.
        _wrapEth();

        // Start new protocol fee period.
        uint256 totalRewardsAvailable = _getAvailableWethBalance();
        _setRewardsAvailable(epoch, totalRewardsAvailable);

        // Handle the case where no pools are eligible to earn rewards.
        _handleAllRewardsPaid(epoch);
    }

    /// @dev Returns the WETH balance of this contract, minus
    ///      any WETH that has already been reserved for rewards.
    function _getAvailableWethBalance()
        internal
        view
        returns (uint256 wethBalance)
    {
        wethBalance = getWethContract().balanceOf(address(this))
            .safeSub(wethReservedForPoolRewards);

        return wethBalance;
    }

    /// @dev Converts the entire ETH balance of this contract into WETH.
    function _wrapEth()
        internal
    {
        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) {
            getWethContract().deposit.value(ethBalance)();
        }
    }

    /// @dev Checks that the protocol fee passed into `payProtocolFee()` is
    ///      valid.
    /// @param protocolFeePaid The `protocolFeePaid` parameter to
    ///        `payProtocolFee.`
    function _assertValidProtocolFee(uint256 protocolFeePaid)
        private
        view
    {
        if (protocolFeePaid == 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidProtocolFeePaymentError(
                    LibStakingRichErrors.ProtocolFeePaymentErrorCodes.ZeroProtocolFeePaid,
                    protocolFeePaid,
                    msg.value
                )
            );
        }
        if (msg.value != protocolFeePaid && msg.value != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidProtocolFeePaymentError(
                    LibStakingRichErrors.ProtocolFeePaymentErrorCodes.MismatchedFeeAndPayment,
                    protocolFeePaid,
                    msg.value
                )
            );
        }
    }
}
