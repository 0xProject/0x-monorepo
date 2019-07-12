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

import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "./libs/LibConstants.sol";


contract MixinWeth is
    LibMath,
    LibConstants
{
    /// @dev Default payable function, this allows us to withdraw WETH
    function ()
        external
        payable
    {
        require(
            msg.sender == address(ETHER_TOKEN),
            "DEFAULT_FUNCTION_WETH_CONTRACT_ONLY"
        );
    }

    /// @dev Converts message call's ETH value into WETH.
    function _convertEthToWeth()
        internal
    {
        require(
            msg.value > 0,
            "INVALID_MSG_VALUE"
        );
        ETHER_TOKEN.deposit.value(msg.value)();
    }

    /// @dev Transfers feePercentage of WETH spent on primary orders to feeRecipient.
    ///      Refunds any excess ETH to msg.sender.
    /// @param wethSold Amount of WETH sold when filling primary orders.
    /// @param feePercentage Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
    /// @param feeRecipient Address that will receive ETH when orders are filled.
    function _transferEthFeeAndRefund(
        uint256 wethSold,
        uint256 feePercentage,
        address payable feeRecipient
    )
        internal
    {
        // Ensure feePercentage is less than 5%.
        require(
            feePercentage <= MAX_FEE_PERCENTAGE,
            "FEE_PERCENTAGE_TOO_LARGE"
        );

        // Ensure that no extra WETH owned by this contract has been sold.
        require(
            wethSold <= msg.value,
            "OVERSOLD_WETH"
        );

        // Calculate amount of WETH that hasn't been sold.
        uint256 wethRemaining = _safeSub(msg.value, wethSold);

        // Calculate ETH fee to pay to feeRecipient.
        uint256 ethFee = _getPartialAmountFloor(
            feePercentage,
            PERCENTAGE_DENOMINATOR,
            wethSold
        );

        // Ensure fee is less than amount of WETH remaining.
        require(
            ethFee <= wethRemaining,
            "INSUFFICIENT_ETH_REMAINING"
        );

        // Do nothing if no WETH remaining
        if (wethRemaining > 0) {
            // Convert remaining WETH to ETH
            ETHER_TOKEN.withdraw(wethRemaining);

            // Pay ETH to feeRecipient
            if (ethFee > 0) {
                feeRecipient.transfer(ethFee);
            }

            // Refund remaining ETH to msg.sender.
            uint256 ethRefund = _safeSub(wethRemaining, ethFee);
            if (ethRefund > 0) {
                msg.sender.transfer(ethRefund);
            }
        }
    }
}
